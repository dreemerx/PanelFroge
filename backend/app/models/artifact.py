"""生成产物模型（图片、视频等资源文件记录）。"""

from __future__ import annotations

from datetime import datetime
from sqlmodel import Field, SQLModel

from app.db.utils import utcnow


class Artifact(SQLModel, table=True):
    """生成产物，记录项目运行过程中产出的图片、视频等资源。"""
    id: int | None = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    run_id: int = Field(foreign_key="run.id", index=True)
    stage_id: int = Field(foreign_key="stage.id", index=True)
    name: str = Field(index=True)
    artifact_type: str = Field(index=True)
    uri: str
    version: int = Field(default=1, ge=1)
    source: str = Field(default="provider")
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
