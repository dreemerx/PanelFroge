"""项目及关联实体（角色、镜头、AgentRun 等）的请求/响应 Schema。"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


TextProviderKey = Literal["anthropic", "openai", "fake"]
ImageProviderKey = Literal["openai", "fake"]
VideoProviderKey = Literal["openai", "doubao", "fake"]


class ProjectProviderEntry(BaseModel):
    """项目级 Provider 解析结果条目。"""
    class Capabilities(BaseModel):
        """Provider 能力描述。"""
        generate: bool | None = None
        stream: bool | None = None

    selected_key: str
    source: Literal["project", "default"]
    resolved_key: str | None
    valid: bool
    status: Literal["valid", "degraded", "invalid"] | None = None
    reason_code: str | None
    reason_message: str | None
    capabilities: Capabilities | None = None


class ProjectProviderSettingsRead(BaseModel):
    """项目 Provider 设置读取模型（文本/图像/视频三条链路）。"""
    text: ProjectProviderEntry
    image: ProjectProviderEntry
    video: ProjectProviderEntry


class ProviderResolution(BaseModel):
    """Provider 解析完整结果，包含有效性判断和各模态条目。"""
    valid: bool
    text: ProjectProviderEntry
    image: ProjectProviderEntry
    video: ProjectProviderEntry

    def as_project_provider_settings(self) -> ProjectProviderSettingsRead:
        """转换为项目 Provider 设置读取模型。"""
        return ProjectProviderSettingsRead(
            text=self.text,
            image=self.image,
            video=self.video,
        )

    def as_error_details(self) -> dict[str, object]:
        """转换为错误详情字典，用于异常响应。"""
        return {
            "valid": self.valid,
            "modalities": self.as_project_provider_settings().model_dump(),
        }


class StoryOutlineAct(BaseModel):
    """故事大纲中的单个幕（Act）。"""
    act: int
    title: str
    summary: str


class StoryOutlineRead(BaseModel):
    """故事大纲读取模型。"""
    logline: str = ""
    genre: list[str] = Field(default_factory=list)
    themes: list[str] = Field(default_factory=list)
    setting: str = ""
    tone: str = ""
    acts: list[StoryOutlineAct] = Field(default_factory=list)
    emotional_arc: str = ""


class StoryOutlineUpdate(BaseModel):
    """故事大纲更新模型。"""
    logline: str | None = None
    genre: list[str] | None = None
    themes: list[str] | None = None
    setting: str | None = None
    tone: str | None = None
    acts: list[StoryOutlineAct] | None = None
    emotional_arc: str | None = None
    visual_bible: str | None = None
    summary: str | None = None
    outline_approved: bool | None = None


class ProjectCreate(BaseModel):
    """创建项目的请求模型。"""
    title: str = Field(min_length=1)
    story: str | None = None
    style: str | None = None
    status: str | None = None
    target_shot_count: int | None = None
    character_hints: list[str] | None = None
    creation_mode: str | None = None
    reference_images: list[str] | None = None
    exports: list[str] | None = None
    text_provider_override: TextProviderKey | None = None
    image_provider_override: ImageProviderKey | None = None
    video_provider_override: VideoProviderKey | None = None
    universe_id: int | None = None
    chapter_number: int | None = None
    chapter_title: str | None = None


class ProjectUpdate(BaseModel):
    """更新项目的请求模型。"""
    title: str | None = None
    story: str | None = None
    style: str | None = None
    status: str | None = None
    target_shot_count: int | None = None
    character_hints: list[str] | None = None
    creation_mode: str | None = None
    reference_images: list[str] | None = None
    exports: list[str] | None = None
    text_provider_override: TextProviderKey | None = None
    image_provider_override: ImageProviderKey | None = None
    video_provider_override: VideoProviderKey | None = None
    universe_id: int | None = None
    chapter_number: int | None = None
    chapter_title: str | None = None


class ProjectBatchDeleteRequest(BaseModel):
    """批量删除项目的请求模型。"""
    ids: list[int] = Field(min_length=1)


class ProjectRead(BaseModel):
    """项目完整读取模型。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    story: str | None
    style: str | None
    summary: str | None
    story_outline: StoryOutlineRead | None = None
    visual_bible: str | None = None
    outline_approved: bool = False
    video_url: str | None
    status: str
    target_shot_count: int | None = None
    character_hints: list[str] = Field(default_factory=list)
    creation_mode: str | None = None
    reference_images: list[str] = Field(default_factory=list)
    exports: list[str] = Field(default_factory=list)
    provider_settings: ProjectProviderSettingsRead
    created_at: datetime
    updated_at: datetime
    universe_id: int | None = None
    chapter_number: int | None = None
    chapter_title: str | None = None


class ProjectListRead(BaseModel):
    """项目列表读取模型。"""
    items: list[ProjectRead]
    total: int


class CharacterRead(BaseModel):
    """角色读取模型。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    description: str | None
    image_url: str | None
    reference_images: list[str] = Field(default_factory=list)
    has_embedding: bool = False
    visual_notes: str | None = None
    approval_state: Literal["draft", "approved", "superseded"]
    approval_version: int
    approved_at: datetime | None
    approved_name: str | None
    approved_description: str | None
    approved_image_url: str | None

    @model_validator(mode="before")
    @classmethod
    def _compute_has_embedding(cls, data: object) -> object:
        if isinstance(data, dict):
            if "has_embedding" not in data and "face_embedding" in data:
                data["has_embedding"] = bool(data.get("face_embedding"))
        # SQLModel object — compute from attribute
        elif hasattr(data, "face_embedding"):
            if not isinstance(data, dict):
                # We need to set has_embedding based on face_embedding
                # from_attributes will pick it up if we pre-set it
                try:
                    data.__dict__["has_embedding"] = bool(getattr(data, "face_embedding", None))
                except (AttributeError, TypeError):
                    pass
        return data


class ShotRead(BaseModel):
    """镜头读取模型。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    order: int
    description: str
    prompt: str | None = None
    image_prompt: str | None = None
    image_url: str | None = None
    video_url: str | None = None
    duration: float | None = None
    camera: str | None = None
    motion_note: str | None = None
    scene: str | None = None
    action: str | None = None
    expression: str | None = None
    lighting: str | None = None
    dialogue: str | None = None
    sfx: str | None = None
    tts_url: str | None = None
    bgm_type: str | None = None
    seed: int | None = None
    character_ids: list[int]
    approval_state: Literal["draft", "approved", "superseded"]
    approval_version: int
    approved_at: datetime | None = None
    approved_description: str | None = None
    approved_prompt: str | None = None
    approved_image_prompt: str | None = None
    approved_duration: float | None = None
    approved_camera: str | None = None
    approved_motion_note: str | None = None
    approved_scene: str | None = None
    approved_action: str | None = None
    approved_expression: str | None = None
    approved_lighting: str | None = None
    approved_dialogue: str | None = None
    approved_sfx: str | None = None
    approved_character_ids: list[int] = Field(default_factory=list)


class ShotUpdate(BaseModel):
    """更新镜头的请求模型。"""
    order: int | None = Field(default=None, ge=1)
    description: str | None = None
    prompt: str | None = None
    image_prompt: str | None = None
    duration: float | None = Field(default=None, gt=0)
    camera: str | None = None
    motion_note: str | None = None
    scene: str | None = None
    action: str | None = None
    expression: str | None = None
    lighting: str | None = None
    dialogue: str | None = None
    sfx: str | None = None
    seed: int | None = None
    character_ids: list[int] | None = None


class CharacterUpdate(BaseModel):
    """更新角色的请求模型。"""
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    image_url: str | None = None
    visual_notes: str | None = None
    reference_images: list[str] | None = None


class RegenerateRequest(BaseModel):
    """重新生成图像或视频的请求模型。"""
    type: Literal["image", "video"]
    description: str | None = None
    image_url: str | None = None


class GenerateRequest(BaseModel):
    """触发项目生成的请求模型。"""
    seed: int | None = None
    notes: str | None = None
    auto_mode: bool = False


class ResumeRequest(BaseModel):
    """恢复已中断任务的请求模型。"""
    run_id: int


class AgentRunRead(BaseModel):
    """Agent 运行记录读取模型。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    status: str
    current_agent: str | None
    progress: float
    error: str | None
    thread_id: str | None = None
    resource_type: str | None  # 资源类型：character|shot|project
    resource_id: int | None  # 资源 ID
    provider_snapshot: ProjectProviderSettingsRead | None = None
    created_at: datetime
    updated_at: datetime


class RecoveryStageRead(BaseModel):
    """恢复流程中单个阶段的状态。"""
    name: str
    status: Literal["completed", "current", "pending", "blocked"]
    artifact_count: int = 0


class RecoverySummaryRead(BaseModel):
    """恢复流程摘要，包含阶段历史和可恢复性判断。"""
    project_id: int
    run_id: int
    thread_id: str
    current_stage: str
    next_stage: str | None = None
    preserved_stages: list[str] = Field(default_factory=list)
    stage_history: list[RecoveryStageRead] = Field(default_factory=list)
    resumable: bool = True


class RecoveryControlRead(BaseModel):
    """恢复控制面板读取模型，返回给前端用于决策。"""
    state: Literal["active", "recoverable"]
    detail: str
    available_actions: list[Literal["resume", "cancel"]] = Field(
        default_factory=lambda: ["resume", "cancel"]
    )
    thread_id: str
    active_run: AgentRunRead
    recovery_summary: RecoverySummaryRead


class FeedbackRequest(BaseModel):
    """用户反馈请求模型。"""
    content: str = Field(min_length=1)
    run_id: int | None = None
    feedback_type: str | None = None
    entity_type: str | None = None
    entity_id: int | None = None


class MessageRead(BaseModel):
    """消息记录读取模型。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    run_id: int | None
    agent: str
    role: str
    content: str
    summary: str | None
    progress: float | None
    is_loading: bool
    created_at: datetime


class AssetCreate(BaseModel):
    """创建资产的请求模型。"""
    name: str = Field(min_length=1, max_length=100)
    asset_type: Literal["character", "scene"]
    description: str | None = None
    image_url: str | None = None
    metadata_json: str | None = None
    source_project_id: int | None = None
    tags: str | None = None


class UseAssetInProjectRequest(BaseModel):
    """将资产导入项目的请求模型。"""
    project_id: int


class AssetRead(BaseModel):
    """资产读取模型。"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    asset_type: str
    description: str | None
    image_url: str | None
    metadata_json: str | None
    source_project_id: int | None
    tags: str | None
    created_at: datetime
    updated_at: datetime


class AssetListRead(BaseModel):
    """资产列表读取模型。"""
    items: list[AssetRead]
    total: int


class CharacterBibleRead(BaseModel):
    """角色圣经 — visual_notes + reference_images + embedding 状态 + 相似度"""

    character_id: int
    name: str
    description: str | None
    visual_notes: str | None
    reference_images: list[str] = Field(default_factory=list)
    has_embedding: bool = False
    similarity_scores: list[dict[str, object]] = Field(default_factory=list)


class CharacterBibleUpdate(BaseModel):
    """更新角色圣经"""

    visual_notes: str | None = None
    reference_images: list[str] | None = None


class ReferenceImageCreate(BaseModel):
    """添加参考图 URL"""

    image_url: str = Field(min_length=1)
    label: str | None = None
