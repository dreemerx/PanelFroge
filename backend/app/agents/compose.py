from __future__ import annotations

import logging
from typing import cast

from sqlalchemy import select
from sqlalchemy.orm import InstrumentedAttribute

from app.agents.base import AgentContext, BaseAgent, CompletionInfo
from app.agents.utils import build_character_context
from app.models.project import Character, Shot
from app.services.audio_service import AudioService
from app.services.creative_control import collect_project_blocking_clips
from app.services.doubao_video import DoubaoVideoService
from app.services.image_composer import ImageComposer
from app.services.shot_binding import resolve_shot_bound_approved_characters
from app.utils.concurrency import run_bounded

logger = logging.getLogger(__name__)


class ComposeAgent(BaseAgent):
    name = "compose"

    def __init__(self):
        super().__init__()
        self.image_composer = ImageComposer()

    def _build_video_prompt(self, shot: Shot, characters: list[Character], *, style: str) -> str:
        desc = shot.prompt or shot.description
        parts = [desc.strip()]
        char_context = build_character_context(characters)
        if char_context:
            parts.append(char_context)
        if style.strip():
            parts.append(f"Style: {style.strip()}")
        return ", ".join(parts)

    def _get_duration(self, shot: Shot, default_duration: float) -> float:
        if shot.duration and shot.duration > 0:
            return shot.duration
        return default_duration

    async def _generate_videos(self, ctx: AgentContext) -> int:
        query = select(Shot).where(
            Shot.project_id == ctx.project.id,
            Shot.video_url.is_(None),
        )
        if ctx.target_ids and ctx.target_ids.shot_ids:
            query = query.where(Shot.id.in_(ctx.target_ids.shot_ids))
        res = await ctx.session.execute(query)
        shots = list(res.scalars().all())

        if not shots:
            await self.send_message(ctx, "所有分镜已有视频。")
            return 0

        use_image_mode = ctx.settings.use_i2v()
        is_doubao = isinstance(ctx.video, DoubaoVideoService)
        default_duration = float(ctx.settings.doubao_video_duration) if is_doubao else 5.0
        image_mode = (ctx.settings.video_image_mode or "first_frame").strip().lower()

        total = len(shots)
        mode_desc = "图生视频" if use_image_mode else "文生视频"

        # Thinking: planning phase — starting video generation
        await self.send_thinking(
            ctx,
            phase="planning",
            content=f"准备为 {total} 个分镜生成视频，模式：{mode_desc}",
            details=f"视频服务商：{'豆包' if is_doubao else 'OpenAI 兼容'}",
        )

        await self.send_message(
            ctx, f"开始为 {total} 个分镜生成视频（{mode_desc}）...", progress=0.0, is_loading=True
        )

        # ── 阶段1：预取所有 shot 数据（需要 session） ──
        # 每个元素: (shot, characters, video_prompt, duration, ref_image_data)
        # ref_image_data: doubao 模式下为 str|None (image_url), 其他为 bytes|None
        prep_list: list[tuple[Shot, list[Character], str, float, str | bytes | None]] = []

        for shot in shots:
            characters = await resolve_shot_bound_approved_characters(ctx.session, shot)
            video_prompt = self._build_video_prompt(shot, characters, style=ctx.project.style)
            duration = self._get_duration(shot, default_duration)

            ref_data: str | bytes | None = None
            if is_doubao:
                if use_image_mode and shot.image_url:
                    if image_mode == "reference":
                        try:
                            char_image_urls = [c.image_url for c in characters if c.image_url]
                            ref_data = await self.image_composer.compose_and_save_reference_image(
                                shot_image_url=shot.image_url,
                                character_image_urls=char_image_urls,
                            )
                        except Exception:
                            ref_data = shot.image_url
                    else:
                        ref_data = shot.image_url
            else:
                if use_image_mode and shot.image_url:
                    try:
                        if image_mode == "reference":
                            char_image_urls = [c.image_url for c in characters if c.image_url]
                            ref_data = await self.image_composer.compose_reference_image(
                                shot_image_url=shot.image_url,
                                character_image_urls=char_image_urls,
                            )
                        else:
                            ref_data = await self.image_composer.compose_reference_image(
                                shot_image_url=shot.image_url,
                                character_image_urls=[],
                            )
                    except Exception:
                        ref_data = None

            prep_list.append((shot, characters, video_prompt, duration, ref_data))

        # ── 阶段2：并行调用视频生成 API（不使用 session） ──
        max_vid = ctx.settings.max_concurrent_videos

        async def _generate_one(
            prep: tuple[Shot, list[Character], str, float, str | bytes | None],
        ) -> str:
            video_prompt, duration, ref_data = prep[2], prep[3], prep[4]
            if is_doubao:
                return await ctx.video.generate_url(
                    prompt=video_prompt,
                    image_url=ref_data if isinstance(ref_data, str) else None,
                    duration=int(duration) if duration in (5, 10) else 5,
                    ratio=ctx.settings.doubao_video_ratio,
                    generate_audio=ctx.settings.doubao_generate_audio,
                )
            else:
                return await ctx.video.generate_url(
                    prompt=video_prompt,
                    image_bytes=ref_data if isinstance(ref_data, bytes) else None,
                )

        coros = [_generate_one(p) for p in prep_list]
        results = await run_bounded(coros, max_vid)

        # ── 阶段3：顺序写 DB + 发送事件 ──
        updated_count = 0
        for i, (prep, result) in enumerate(zip(prep_list, results)):
            shot = prep[0]
            try:
                if isinstance(result, BaseException):
                    raise result

                await self.send_progress_batch(
                    ctx, total=total, current=i, message=f"   正在保存视频 {i + 1}/{total}..."
                )

                shot.video_url = result
                shot.duration = prep[3]
                ctx.session.add(shot)
                await ctx.session.flush()
                await self.send_shot_event(ctx, shot, "shot_updated")
                updated_count += 1
            except Exception as e:
                await self.send_message(ctx, f"镜头 {shot.order} 视频生成失败: {e}")

        await ctx.session.commit()
        return updated_count

    async def _merge_videos(self, ctx: AgentContext) -> None:
        project_id = ctx.project.id
        if project_id is None:
            raise RuntimeError("Project must be persisted before final assembly")

        if (
            ctx.project.video_url
            and ctx.project.status != "superseded"
            and ctx.rerun_mode == "full"
        ):
            await self.send_message(ctx, "项目已有最终视频。")
            return

        blocking_clips = await collect_project_blocking_clips(ctx.session, ctx.project)
        if blocking_clips:
            if ctx.project.video_url:
                ctx.project.status = "superseded"
            ctx.session.add(ctx.project)
            await ctx.session.commit()
            await ctx.session.refresh(ctx.project)
            await self.send_message(
                ctx, "当前仍有分镜视频未满足拼接条件，请先完成这些分镜。", progress=1.0
            )
            await ctx.ws.send_event(
                project_id,
                {
                    "type": "project_updated",
                    "data": {
                        "project": {
                            "id": ctx.project.id,
                            "video_url": ctx.project.video_url,
                            "status": ctx.project.status,
                            "blocking_clips": blocking_clips,
                        }
                    },
                },
            )
            return

        shot_project_id_col = cast(InstrumentedAttribute[int], cast(object, Shot.project_id))
        shot_video_url_col = cast(InstrumentedAttribute[str | None], cast(object, Shot.video_url))
        shot_order_col = cast(InstrumentedAttribute[int], cast(object, Shot.order))
        res = await ctx.session.execute(
            select(Shot)
            .where(shot_project_id_col == project_id, shot_video_url_col.is_not(None))
            .order_by(shot_order_col.asc())
        )
        shots = res.scalars().all()

        if not shots:
            await self.send_message(ctx, "没有可拼接的分镜视频。")
            return

        video_urls = [shot.video_url for shot in shots if shot.video_url]
        if not video_urls:
            await self.send_message(ctx, "没有有效的视频 URL 可拼接。")
            return

        try:
            await self.send_message(
                ctx, f"开始拼接 {len(video_urls)} 个分镜视频...", progress=0.0, is_loading=True
            )
            merged_url = await ctx.video.merge_urls(video_urls)

            ctx.project.video_url = merged_url
            ctx.project.status = "ready"
            ctx.session.add(ctx.project)
            await ctx.session.commit()
            await ctx.session.refresh(ctx.project)

            await ctx.ws.send_event(
                project_id,
                {
                    "type": "project_updated",
                    "data": {
                        "project": {
                            "id": ctx.project.id,
                            "video_url": merged_url,
                            "status": ctx.project.status,
                            "blocking_clips": [],
                        }
                    },
                },
            )

            summary = f"将{len(video_urls)}个分镜拼接为完整视频"
            first_shot = shots[0] if shots else None
            shot_hint = (
                f"「{first_shot.description[:15]}…」"
                if first_shot and first_shot.description
                else ""
            )
            ctx.completion_info = CompletionInfo(
                completed=f"已将 {len(video_urls)} 个分镜拼接为完整视频",
                next="您的漫剧已经准备就绪！可以下载或分享了。",
                question="最终视频效果满意吗？",
            )
            await self.send_message(
                ctx,
                f"漫剧制作完成！{shot_hint}等 {len(video_urls)} 个分镜已拼接为完整视频。",
                summary=summary,
                progress=1.0,
            )
        except Exception as e:
            await self.send_message(ctx, f"视频拼接失败: {e}。您可以稍后手动拼接。", progress=1.0)

    async def _add_audio_to_videos(self, ctx: AgentContext) -> None:
        """为分镜视频添加 TTS 配音 + BGM 背景音乐

        容错设计：
        - TTS 失败时跳过，仅加 BGM
        - BGM 失败时跳过
        - 整个阶段失败不阻塞主流程
        """
        settings = ctx.settings
        tts_enabled = settings.tts_enabled
        bgm_enabled = settings.bgm_enabled

        if not tts_enabled and not bgm_enabled:
            await self.send_message(ctx, "TTS 和 BGM 均未启用，跳过音频阶段。")
            return

        audio_service = AudioService(settings)

        # 获取所有有视频的分镜
        shot_project_id_col = cast(InstrumentedAttribute[int], cast(object, Shot.project_id))
        shot_video_url_col = cast(InstrumentedAttribute[str | None], cast(object, Shot.video_url))
        shot_order_col = cast(InstrumentedAttribute[int], cast(object, Shot.order))
        res = await ctx.session.execute(
            select(Shot)
            .where(shot_project_id_col == ctx.project.id, shot_video_url_col.is_not(None))
            .order_by(shot_order_col.asc())
        )
        shots = list(res.scalars().all())

        # 获取项目角色列表（用于 TTS 语音选择）
        characters = await self.get_project_characters(ctx)

        total = len(shots)
        audio_count = 0

        await self.send_message(
            ctx,
            f"开始添加音频：TTS={'开启' if tts_enabled else '关闭'}，BGM={'开启' if bgm_enabled else '关闭'}...",
            progress=0.0,
            is_loading=True,
        )

        # ── 阶段1：预取 BGM 匹配 + 构建 TTS 参数（同步操作） ──
        # 每个元素: (shot, character_name, bgm_path, bgm_type)
        audio_prep: list[tuple[Shot, str, str | None, str | None]] = []
        for shot in shots:
            character_name = ""
            if tts_enabled and shot.dialogue and shot.character_ids:
                for char in characters:
                    if char.id in shot.character_ids:
                        character_name = char.name
                        break

            bgm_path: str | None = None
            bgm_type: str | None = None
            if bgm_enabled:
                bgm_path = audio_service.match_bgm(
                    scene=shot.scene,
                    expression=shot.expression,
                )
                if bgm_path:
                    bgm_type = bgm_path.rsplit("/", 1)[-1].replace(".mp3", "")

            audio_prep.append((shot, character_name, bgm_path, bgm_type))

        # ── 阶段2：并行生成 TTS + 混音（外部 API + FFmpeg，不使用 session） ──
        max_tts = ctx.settings.max_concurrent_tts

        async def _process_audio(
            prep: tuple[Shot, str, str | None, str | None],
        ) -> tuple[str | None, str | None]:
            """返回 (tts_url, new_video_url)"""
            shot, character_name, bgm_path, _bgm_type = prep

            tts_url: str | None = None
            if tts_enabled and shot.dialogue:
                tts_url = await audio_service.generate_character_tts(
                    dialogue=shot.dialogue,
                    character_name=character_name,
                    characters=characters,
                )

            new_video_url: str | None = None
            if (tts_url or bgm_path) and shot.video_url:
                new_video_url = await audio_service.mix_audio_into_video(
                    video_path=shot.video_url,
                    tts_path=tts_url,
                    bgm_path=bgm_path,
                )

            return tts_url, new_video_url

        coros = [_process_audio(p) for p in audio_prep]
        results = await run_bounded(coros, max_tts)

        # ── 阶段3：顺序写 DB + 发送事件 ──
        for i, (prep, result) in enumerate(zip(audio_prep, results)):
            shot, _character_name, _bgm_path, bgm_type = prep
            try:
                await self.send_progress_batch(
                    ctx, total=total, current=i,
                    message=f"   正在保存音频 {i + 1}/{total}...",
                )

                if isinstance(result, BaseException):
                    raise result

                tts_url, new_video_url = result

                if tts_url:
                    shot.tts_url = tts_url
                if bgm_type:
                    shot.bgm_type = bgm_type
                if new_video_url and new_video_url != shot.video_url:
                    shot.video_url = new_video_url
                    audio_count += 1

                ctx.session.add(shot)
                await ctx.session.flush()

                await ctx.ws.send_event(
                    ctx.project.id,
                    {
                        "type": "audio_generated",
                        "data": {
                            "shot_id": shot.id,
                            "tts_url": shot.tts_url,
                            "bgm_type": shot.bgm_type,
                            "duration": shot.duration,
                        },
                    },
                )

            except Exception as e:
                logger.warning("Audio processing failed for shot %s: %s", shot.id, e)
                await self.send_message(
                    ctx, f"分镜 {shot.order} 音频处理失败: {e}，跳过。"
                )

        # 4. 为最终合并视频匹配 BGM
        if bgm_enabled and ctx.project.video_url:
            try:
                # 使用所有分镜的场景信息综合匹配
                scenes = [s.scene for s in shots if s.scene]
                expressions = [s.expression for s in shots if s.expression]
                combined = " ".join(scenes + expressions)
                final_bgm_path = audio_service.match_bgm(
                    scene=combined if combined else None,
                    expression=None,
                    genre=ctx.project.style,
                )
                if final_bgm_path:
                    new_project_url = await audio_service.mix_bgm_into_video(
                        video_path=ctx.project.video_url,
                        bgm_path=final_bgm_path,
                    )
                    if new_project_url != ctx.project.video_url:
                        ctx.project.video_url = new_project_url
                        ctx.session.add(ctx.project)
            except Exception as e:
                logger.warning("Final video BGM mixing failed: %s", e)

        await ctx.session.commit()

        if audio_count > 0:
            ctx.completion_info = CompletionInfo(
                completed=f"已为 {audio_count} 个分镜添加音频",
                next="音频处理完成，请查看最终效果",
                question="配音和背景音乐效果如何？",
            )
        else:
            ctx.completion_info = CompletionInfo(
                completed="音频阶段完成",
                next="",
                question="",
            )

        await self.send_message(
            ctx,
            f"音频处理完成！为 {audio_count} 个分镜添加了音频。",
            progress=1.0,
        )

    async def run_videos(self, ctx: AgentContext) -> int:
        """Generate shot videos only (sub-step 1)."""
        await self.send_message(ctx, "开始生成分镜视频...", progress=0.0, is_loading=True)
        video_count = await self._generate_videos(ctx)
        if video_count > 0:
            ctx.completion_info = CompletionInfo(
                completed=f"已生成 {video_count} 个分镜视频",
                next="接下来拼接完整视频",
                question="分镜视频效果如何？",
            )
        else:
            ctx.completion_info = CompletionInfo(
                completed="无视频可生成",
                next="跳过拼接",
                question="",
            )
        return video_count

    async def run_merge(self, ctx: AgentContext) -> None:
        """Merge shot videos into final video (sub-step 2)."""
        await self._merge_videos(ctx)

    async def run_add_audio(self, ctx: AgentContext) -> None:
        """Add TTS dubbing and BGM to shot videos and final merged video (sub-step 3)."""
        await self._add_audio_to_videos(ctx)

    async def run(self, ctx: AgentContext) -> None:
        """Legacy entry point — runs both sub-steps sequentially."""
        await self.send_message(
            ctx, "开始合成：先生成分镜视频，再拼接完整视频...", progress=0.0, is_loading=True
        )
        video_count = await self.run_videos(ctx)
        if video_count > 0:
            await self.run_merge(ctx)
        else:
            await self.send_message(ctx, "无视频可合成。", progress=1.0)
