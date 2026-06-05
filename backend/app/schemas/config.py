"""系统配置相关的请求/响应 Schema。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ConfigItemRead(BaseModel):
    """单个配置项的读取模型。"""
    key: str
    value: str | None
    is_sensitive: bool
    is_masked: bool
    source: Literal["db", "env", "default"]


class ConfigUpdateRequest(BaseModel):
    """批量更新配置项的请求模型。"""
    configs: dict[str, str | None] = Field(default_factory=dict)


class ConfigUpdateResponse(BaseModel):
    """批量更新配置项的响应模型。"""
    updated: int
    skipped: int
    restart_required: bool
    restart_keys: list[str]
    message: str


class TestConnectionRequest(BaseModel):
    """测试服务连通性的请求模型。"""
    service: Literal["llm", "image", "video"]
    # 可选：传递当前表单中的配置值（用于测试未保存的配置）
    config_overrides: dict[str, str | None] | None = None


class ConnectionCapabilities(BaseModel):
    """服务连接能力描述（是否支持生成和流式）。"""
    generate: bool | None = None
    stream: bool | None = None


class TestConnectionResponse(BaseModel):
    """测试服务连通性的响应模型。"""
    success: bool
    message: str
    details: str | None = None
    status: Literal["valid", "degraded", "invalid"] | None = None
    capabilities: ConnectionCapabilities | None = None


class RevealValueRequest(BaseModel):
    """揭示敏感配置值的请求模型。"""
    key: str


class RevealValueResponse(BaseModel):
    """揭示敏感配置值的响应模型。"""
    key: str
    value: str | None
