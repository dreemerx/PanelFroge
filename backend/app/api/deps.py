"""FastAPI 依赖注入函数，提供数据库会话、配置、权限校验等公共依赖。"""

from __future__ import annotations

from collections.abc import AsyncGenerator
import secrets
from typing import TypeVar

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db.session import get_session
from app.models.agent_run import AgentRun
from app.ws.manager import ConnectionManager, ws_manager

T = TypeVar("T")


async def get_app_settings() -> Settings:
    """获取全局应用配置实例。"""
    return get_settings()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """获取异步数据库会话，自动管理生命周期。"""
    async for session in get_session():
        yield session


async def get_ws_manager() -> ConnectionManager:
    """获取 WebSocket 连接管理器单例。"""
    return ws_manager


async def require_admin(
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
) -> None:
    """校验管理员 Token，未配置 admin_token 时放行，否则必须匹配。"""
    settings = get_settings()
    if not settings.admin_token:
        return
    if not x_admin_token or not secrets.compare_digest(x_admin_token, settings.admin_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


def require_run_id(run: AgentRun) -> int:
    """确保已持久化的 AgentRun 拥有 ID，否则抛出异常。"""
    run_id = run.id
    if run_id is None:
        raise RuntimeError("Persisted AgentRun is missing an id")
    return run_id


async def get_or_404(
    session: AsyncSession, model: type[T], id: int, detail: str | None = None
) -> T:
    """根据主键获取数据库对象，未找到则抛出 404。"""
    obj = await session.get(model, id)
    if not obj:
        raise HTTPException(status_code=404, detail=detail or f"{model.__name__} not found")
    return obj


SettingsDep = Depends(get_app_settings)
SessionDep = Depends(get_db_session)
WsManagerDep = Depends(get_ws_manager)
AdminDep = Depends(require_admin)
