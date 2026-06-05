"""Phase2 工作流状态定义 — 阶段类型、状态字典、进度计算和运行时上下文"""

from __future__ import annotations

from dataclasses import dataclass
from operator import add
from typing import Annotated, Any, Literal, TypedDict


Phase2Stage = Literal[
    "plan_outline",
    "outline_approval",
    "plan_characters",
    "characters_approval",
    "plan_shots",
    "shots_approval",
    "render_characters",
    "character_images_approval",
    "critique_character_images",
    "render_shots",
    "shot_images_approval",
    "critique_shot_images",
    "compose_videos",
    "compose_merge",
    "add_audio",
    "compose_approval",
    "review",
]

# Ordered sequence of production stages (excludes approval gates).
PRODUCTION_STAGE_SEQUENCE: tuple[str, ...] = (
    "plan_outline",
    "plan_characters",
    "plan_shots",
    "render_characters",
    "render_shots",
    "compose_videos",
    "compose_merge",
    "add_audio",
)


# Approval gate → the production stage it comes right after
_APPROVAL_TO_PRODUCED_STAGE: dict[str, str] = {
    "outline_approval": "plan_outline",
    "characters_approval": "plan_characters",
    "shots_approval": "plan_shots",
    "character_images_approval": "render_characters",
    "shot_images_approval": "render_shots",
    "compose_approval": "add_audio",
}

_CRITIQUE_TO_PRODUCED_STAGE: dict[str, str] = {
    "critique_character_images": "render_characters",
    "critique_shot_images": "render_shots",
}


def _resolve_base_stage(stage: str) -> str | None:
    """将任意阶段（生产/审批/审查）映射到其对应的生产阶段"""
    if stage in PRODUCTION_STAGE_SEQUENCE:
        return stage
    base = _APPROVAL_TO_PRODUCED_STAGE.get(stage)
    if base is not None:
        return base
    return _CRITIQUE_TO_PRODUCED_STAGE.get(stage)


def next_production_stage(stage: str | None) -> str | None:
    """返回给定阶段之后的下一个生产阶段，若无后续则返回 None"""
    if not isinstance(stage, str):
        return None
    base = _resolve_base_stage(stage)
    if base is None:
        return None
    next_index = PRODUCTION_STAGE_SEQUENCE.index(base) + 1
    if next_index >= len(PRODUCTION_STAGE_SEQUENCE):
        return None
    return PRODUCTION_STAGE_SEQUENCE[next_index]


def workflow_progress_for_stage(stage: str, *, within_stage: float = 0.0) -> float:
    """根据阶段在生产序列中的位置计算整体工作流进度（0.0-1.0）"""
    base = _resolve_base_stage(stage)
    if base is None:
        return 0.0

    clamped_within = max(0.0, min(within_stage, 1.0))
    stage_index = PRODUCTION_STAGE_SEQUENCE.index(base)
    total = len(PRODUCTION_STAGE_SEQUENCE)
    return min((stage_index + clamped_within) / total, 1.0)


class Phase2State(TypedDict, total=False):
    """Phase2 工作流的 LangGraph 状态字典类型"""
    project_id: int
    run_id: int
    thread_id: str
    current_stage: str
    next_stage: str
    stage_history: Annotated[list[str], add]
    approval_history: Annotated[list[str], add]
    artifact_lineage: Annotated[list[str], add]
    approval_feedback: str
    review_requested: bool
    route_stage: str
    route_mode: str
    video_generation_skipped: bool
    critique_scores: dict
    critique_round: int


@dataclass(slots=True)
class Phase2RuntimeContext:
    """Phase2 运行时上下文，注入到 LangGraph 节点中供其访问编排器和 Agent 上下文"""
    orchestrator: Any
    agent_context: Any
    start_stage: Phase2Stage = "plan_outline"
    auto_mode: bool = False
