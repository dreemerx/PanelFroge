"""生成入口决策服务 — 判断项目是否可以启动新一轮生成，处理冲突和阻塞。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.models.agent_run import AgentRun
from app.schemas.project import ProviderResolution

INITIAL_GENERATION_BLOCKING_MODALITIES = ("text", "image")


@dataclass(frozen=True)
class GenerationEntryDecision:
    """生成入口决策结果。"""
    kind: Literal["active_conflict", "recoverable_conflict", "provider_blocked", "start"]
    run: AgentRun | None = None


def has_initial_generation_blockers(provider_resolution: ProviderResolution) -> bool:
    """检查是否存在初始生成的 Provider 阻塞项（文本或图像 Provider 无效）。"""
    return any(
        not getattr(provider_resolution, modality).valid
        for modality in INITIAL_GENERATION_BLOCKING_MODALITIES
    )


def decide_generation_entry(
    *,
    active_run: AgentRun | None,
    resumable_run: AgentRun | None,
    provider_resolution: ProviderResolution,
) -> GenerationEntryDecision:
    """根据当前运行状态和 Provider 可用性决定生成入口行为。

    Args:
        active_run: 当前活跃的 AgentRun
        resumable_run: 可恢复的 AgentRun
        provider_resolution: Provider 解析结果

    Returns:
        生成入口决策（启动/冲突/阻塞）
    """
    if active_run is not None:
        return GenerationEntryDecision(kind="active_conflict", run=active_run)

    if resumable_run is not None:
        return GenerationEntryDecision(kind="recoverable_conflict", run=resumable_run)

    if has_initial_generation_blockers(provider_resolution):
        return GenerationEntryDecision(kind="provider_blocked")

    return GenerationEntryDecision(kind="start")
