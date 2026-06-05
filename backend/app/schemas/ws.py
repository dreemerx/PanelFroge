"""WebSocket 事件相关的 Schema 定义。"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from .project import (
    CharacterRead,
    ProjectProviderSettingsRead,
    RecoverySummaryRead,
    ShotRead,
    StoryOutlineRead,
)


WsEventType = Literal[
    "connected",
    "pong",
    "echo",
    "error",
    "run_started",
    "run_progress",
    "run_message",
    "agent_thinking",
    "run_completed",
    "run_failed",
    "run_awaiting_confirm",
    "run_confirmed",
    "run_cancelled",
    "character_created",
    "character_updated",
    "character_deleted",
    "shot_created",
    "shot_updated",
    "shot_deleted",
    # Kept for backward compatibility; current outline writes usually emit
    # project_updated, but stale clients/tests may still send outline_updated.
    "outline_updated",
    "project_updated",
    "data_cleared",
    "critique_result",
    "bible_updated",
    "version_created",
    "version_rollback",
    "audio_generated",
    "export_completed",
    "consistency_eval_completed",
]


class RunProgressEventData(BaseModel):
    """运行进度事件数据。"""
    run_id: int
    project_id: int | None = None
    current_agent: str | None = None
    current_stage: str | None = None
    stage: str | None = None
    next_stage: str | None = None
    progress: float = Field(ge=0.0, le=1.0)
    recovery_summary: RecoverySummaryRead | None = None


class RunStartedEventData(BaseModel):
    """运行开始事件数据。"""
    run_id: int
    project_id: int | None = None
    provider_snapshot: dict[str, Any] | None = None
    current_stage: str | None = None
    stage: str | None = None
    next_stage: str | None = None
    progress: float = Field(ge=0.0, le=1.0, default=0.0)
    current_agent: str | None = None
    recovery_summary: RecoverySummaryRead | None = None
    preserved_stages: list[str] = Field(default_factory=list)


class RunMessageEventData(BaseModel):
    """运行消息事件数据（Agent 输出的文本流）。"""
    agent: str | None = None
    role: str | None = None
    content: str = ""
    summary: str | None = None
    progress: float | None = Field(default=None, ge=0.0, le=1.0)
    isLoading: bool | None = None


class RunCompletedEventData(BaseModel):
    """运行完成事件数据。"""
    run_id: int | None = None
    project_id: int | None = None
    current_stage: str | None = None
    current_agent: str | None = None
    message: str | None = None
    video_generation_pending: bool | None = None


class RunFailedEventData(BaseModel):
    """运行失败事件数据。"""
    run_id: int | None = None
    project_id: int | None = None
    error: str | None = None
    agent: str | None = None
    current_stage: str | None = None


class RunCancelledEventData(BaseModel):
    """运行取消事件数据。"""
    run_id: int | None = None
    project_id: int | None = None
    run_ids: list[int] | None = None
    cancelled_count: int | None = None


class DataClearedEventData(BaseModel):
    """数据清除事件数据。"""
    cleared_types: list[str] = Field(default_factory=list)


class ErrorEventData(BaseModel):
    """错误事件数据。"""
    code: str
    message: str


class CharacterCreatedEventData(BaseModel):
    """角色创建事件数据。"""
    character: CharacterRead


class CharacterDeletedEventData(BaseModel):
    """角色删除事件数据。"""
    character_id: int


class ShotCreatedEventData(BaseModel):
    """镜头创建事件数据。"""
    shot: ShotRead


class ShotDeletedEventData(BaseModel):
    """镜头删除事件数据。"""
    shot_id: int


class OutlineUpdatedEventData(BaseModel):
    """大纲更新事件数据。"""
    project_id: int
    story_outline: StoryOutlineRead | None = None
    visual_bible: str | None = None
    outline_approved: bool = False


class RunAwaitingConfirmEventData(BaseModel):
    """运行等待确认事件数据（Agent 暂停等待用户确认）。"""
    run_id: int
    project_id: int | None = None
    agent: str
    gate: str | None = None
    current_stage: str | None = None
    stage: str | None = None
    next_stage: str | None = None
    recovery_summary: RecoverySummaryRead
    preserved_stages: list[str] = Field(default_factory=list)
    message: str | None = None
    completed: str | None = None
    next_step: str | None = None
    question: str | None = None
    auto_mode: bool | None = None
    story_outline: StoryOutlineRead | None = None
    visual_bible: str | None = None


class RunConfirmedEventData(BaseModel):
    """运行确认事件数据（用户确认后继续）。"""
    run_id: int
    project_id: int | None = None
    agent: str
    gate: str | None = None
    current_stage: str | None = None
    stage: str | None = None
    next_stage: str | None = None
    recovery_summary: RecoverySummaryRead | None = None
    auto_mode: bool | None = None


class CharacterUpdatedEventData(BaseModel):
    """角色更新事件数据。"""
    character: CharacterRead


class ShotUpdatedEventData(BaseModel):
    """镜头更新事件数据。"""
    shot: ShotRead


class BlockingClipPayload(BaseModel):
    """阻塞片段载荷，描述阻碍视频合成的镜头。"""
    shot_id: int
    order: int
    status: str
    reason: str


class ProjectUpdatedPayload(BaseModel):
    """项目更新事件中的项目数据载荷。"""
    id: int
    title: str | None = None
    story: str | None = None
    style: str | None = None
    summary: str | None = None
    video_url: str | None = None
    status: str | None = None
    target_shot_count: int | None = None
    character_hints: list[str] | None = None
    creation_mode: str | None = None
    reference_images: list[str] | None = None
    exports: list[str] | None = None
    provider_settings: ProjectProviderSettingsRead | None = None
    universe_id: int | None = None
    chapter_number: int | None = None
    chapter_title: str | None = None
    story_outline: StoryOutlineRead | None = None
    visual_bible: str | None = None
    outline_approved: bool | None = None
    blocking_clips: list[BlockingClipPayload] | None = None


class ProjectUpdatedEventData(BaseModel):
    """项目更新事件数据。"""
    project: ProjectUpdatedPayload


class CritiqueResultEventData(BaseModel):
    """评审结果事件数据。"""
    score: float = Field(ge=0.0, le=10.0)
    dimensions: dict[str, int] = Field(default_factory=dict)
    issues: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    entity_type: str = ""  # "character" or "shot"
    entity_id: int = 0
    will_regenerate: bool = False


class BibleUpdatedEventData(BaseModel):
    """角色圣经更新事件数据。"""
    character_id: int
    visual_notes: bool = False  # whether visual_notes was updated
    reference_images_count: int = 0
    has_embedding: bool = False


class AudioGeneratedEventData(BaseModel):
    """音频生成完成事件数据。"""
    shot_id: int
    tts_url: str | None = None
    bgm_type: str | None = None
    duration: float | None = None


class AgentThinkingEventData(BaseModel):
    """Agent 思考过程事件数据。"""
    agent: str
    phase: Literal["reasoning", "decision", "planning", "reviewing"]
    content: str
    details: str | None = None


class VersionCreatedEventData(BaseModel):
    """版本创建事件数据。"""
    entity_type: Literal["character", "shot"]
    entity_id: int
    version: int
    trigger: str


class VersionRollbackEventData(BaseModel):
    """版本回滚事件数据。"""
    entity_type: Literal["character", "shot"]
    entity_id: int
    from_version: int
    to_version: int


class ConsistencyEvalCompletedEventData(BaseModel):
    """一致性评估完成事件数据。"""
    project_id: int
    overall_score: float = Field(ge=0.0, le=100.0)
    character_count: int = 0


class WsEvent(BaseModel):
    """WebSocket 事件通用包装模型。"""
    type: WsEventType
    data: dict[str, Any] = Field(default_factory=dict)
