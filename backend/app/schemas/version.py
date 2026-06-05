"""版本管理相关的请求/响应 Schema。"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

EntityType = Literal["character", "shot"]


class ArtifactVersionRead(BaseModel):
    """制品版本读取模型。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: EntityType
    entity_id: int
    version: int
    snapshot: dict[str, Any] = Field(default_factory=dict)
    trigger: str
    created_at: datetime


class VersionListRead(BaseModel):
    """版本列表读取模型。"""
    entity_type: EntityType
    entity_id: int
    versions: list[ArtifactVersionRead]


class RollbackRequest(BaseModel):
    """版本回滚请求模型。"""
    entity_type: EntityType
    entity_id: int
    target_version: int = Field(ge=1)


class RollbackResponse(BaseModel):
    """版本回滚响应模型。"""
    success: bool
    message: str
    new_version: ArtifactVersionRead | None = None


class VersionDiff(BaseModel):
    """版本间单个字段的差异描述。"""
    field_name: str
    old_value: Any = None
    new_value: Any = None


class VersionCompareRead(BaseModel):
    """版本对比结果读取模型。"""
    entity_type: EntityType
    entity_id: int
    from_version: ArtifactVersionRead
    to_version: ArtifactVersionRead
    diffs: list[VersionDiff]
