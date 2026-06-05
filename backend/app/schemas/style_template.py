"""风格模板相关的请求/响应 Schema。"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class StyleTemplateRead(BaseModel):
    """风格模板读取模型。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    category: str
    description: Optional[str] = None
    style_prompt: str
    color_palette: list[str] = Field(default_factory=list)
    negative_prompt: Optional[str] = None
    preview_image_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class StyleTemplateListRead(BaseModel):
    """风格模板列表读取模型。"""
    items: list[StyleTemplateRead]
    total: int


class StyleTemplateCreate(BaseModel):
    """创建风格模板的请求模型。"""
    name: str = Field(min_length=1)
    slug: str = Field(min_length=1, pattern=r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$")
    description: Optional[str] = None
    style_prompt: str = Field(min_length=1)
    color_palette: list[str] = Field(default_factory=list)
    negative_prompt: Optional[str] = None
    preview_image_url: Optional[str] = None


class StyleTemplateUpdate(BaseModel):
    """更新风格模板的请求模型。"""
    name: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    style_prompt: Optional[str] = Field(default=None, min_length=1)
    color_palette: Optional[list[str]] = None
    negative_prompt: Optional[str] = None
    preview_image_url: Optional[str] = None
