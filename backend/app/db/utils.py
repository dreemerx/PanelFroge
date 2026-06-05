"""数据库工具函数。"""

from __future__ import annotations

from datetime import UTC, datetime


def utcnow() -> datetime:
    """返回当前 UTC 时间（不带时区信息，兼容 PostgreSQL TIMESTAMP WITHOUT TIME ZONE）。

    Returns:
        当前 UTC datetime 对象（tzinfo=None）。
    """
    return datetime.now(UTC).replace(tzinfo=None)
