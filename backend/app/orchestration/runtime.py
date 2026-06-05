"""Phase2 运行时工具 — 图配置、运行时上下文和恢复配置的构建"""

from __future__ import annotations

from typing import Any

from app.models.run import Run

from .state import Phase2RuntimeContext, Phase2Stage


def build_graph_config(run: Run | Any) -> dict[str, dict[str, str]]:
    """根据 Run 对象构建 LangGraph 的 configurable 配置（含 thread_id）"""
    thread_id = getattr(run, "thread_id", None)
    if not isinstance(thread_id, str) or not thread_id.strip():
        run_id = getattr(run, "id", None)
        if run_id is None:
            raise ValueError("Run must define either thread_id or id")
        thread_id = f"agent-run-{run_id}"
    return {"configurable": {"thread_id": thread_id}}


def build_phase2_runtime_context(
    *,
    orchestrator: Any,
    agent_context: Any,
    start_stage: Phase2Stage = "plan_outline",
    auto_mode: bool = False,
) -> Phase2RuntimeContext:
    """构建 Phase2 运行时上下文数据类"""
    return Phase2RuntimeContext(
        orchestrator=orchestrator,
        agent_context=agent_context,
        start_stage=start_stage,
        auto_mode=auto_mode,
    )


async def build_stage_recovery_config(
    graph: Any,
    run: Run,
    *,
    before_stage: str,
    limit: int | None = None,
) -> dict[str, dict[str, str]]:
    """从检查点历史中找到指定阶段之前的快照配置，用于恢复执行"""
    config = build_graph_config(run)
    if hasattr(graph, "aget_state_history"):
        async for snapshot in graph.aget_state_history(config, limit=limit):
            next_nodes = getattr(snapshot, "next", ())
            if next_nodes and next_nodes[0] == before_stage:
                return snapshot.config
    else:
        for snapshot in graph.get_state_history(config, limit=limit):
            next_nodes = getattr(snapshot, "next", ())
            if next_nodes and next_nodes[0] == before_stage:
                return snapshot.config
    return config


async def get_checkpoint_history(graph: Any, run: Run, *, limit: int | None = None) -> list[Any]:
    """获取图的检查点历史记录列表"""
    history: list[Any] = []
    config = build_graph_config(run)
    if hasattr(graph, "aget_state_history"):
        async for snapshot in graph.aget_state_history(config, limit=limit):
            history.append(snapshot)
    else:
        history.extend(list(graph.get_state_history(config, limit=limit)))
    return history
