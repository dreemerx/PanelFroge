"""审批门控服务 — 判断项目是否满足进入视频生成和最终合并的前置条件。"""

from __future__ import annotations

from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from app.agents.base import TargetIds
from app.models.agent_run import AgentRun
from app.models.project import Project, Shot
from app.services.creative_control import collect_project_blocking_clips


async def can_enter_clip_generation(
    session: AsyncSession, run: AgentRun, target_ids: TargetIds | None = None
) -> bool:
    """判断是否可以进入视频片段生成阶段。

    所有关联分镜必须处于已审批（approved）状态。

    Args:
        session: 数据库会话
        run: 当前 AgentRun
        target_ids: 可选的目标分镜/角色 ID

    Returns:
        是否满足进入条件
    """
    if run.id is None:
        return False

    shot_project_id_col = cast(InstrumentedAttribute[int], cast(object, Shot.project_id))
    shot_order_col = cast(InstrumentedAttribute[int], cast(object, Shot.order))

    required_shot_ids: list[int] | None = None
    if target_ids and target_ids.shot_ids:
        required_shot_ids = list(dict.fromkeys(target_ids.shot_ids))
    elif run.resource_type == "shot" and run.resource_id is not None:
        required_shot_ids = [run.resource_id]

    if required_shot_ids is None:
        result = await session.execute(
            select(Shot).where(shot_project_id_col == run.project_id).order_by(shot_order_col)
        )
        shots = result.scalars().all()
    else:
        shot_id_col = cast(InstrumentedAttribute[int], cast(object, Shot.id))
        result = await session.execute(
            select(Shot)
            .where(shot_project_id_col == run.project_id)
            .where(shot_id_col.in_(required_shot_ids))
            .order_by(shot_order_col)
        )
        shots = result.scalars().all()
        found_ids = {shot.id for shot in shots if shot.id is not None}
        if len(found_ids) != len(required_shot_ids):
            return False

    if not shots:
        return False

    return all(shot.approval_state == "approved" for shot in shots)


async def can_enter_final_merge(session: AsyncSession, project: Project) -> bool:
    """判断是否可以进入最终视频合并阶段。

    需要所有分镜视频均已就绪（无阻塞项）。

    Args:
        session: 数据库会话
        project: 项目对象

    Returns:
        是否满足进入条件
    """
    return not await collect_project_blocking_clips(session, project)
