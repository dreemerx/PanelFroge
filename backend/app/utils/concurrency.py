"""并发执行工具 — 用于限制外部 API 调用的并发数"""

from __future__ import annotations

import asyncio
from collections.abc import Coroutine, Sequence
from typing import TypeVar

T = TypeVar("T")


async def run_bounded(
    coros: Sequence[Coroutine[object, object, T]],
    max_concurrent: int,
) -> list[T | BaseException]:
    """带并发上限的 gather。

    Args:
        coros: 协程列表（不是 coroutine factory，直接传 awaitable 对象）
        max_concurrent: 最大并发数

    Returns:
        与输入顺序一致的结果列表（包含成功值或异常）
    """
    sem = asyncio.Semaphore(max_concurrent)

    async def _run(coro: Coroutine[object, object, T]) -> T:
        async with sem:
            return await coro

    return await asyncio.gather(*[_run(c) for c in coros], return_exceptions=True)
