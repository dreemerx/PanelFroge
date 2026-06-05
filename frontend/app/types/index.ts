// 前端核心类型定义，包含项目、角色、分镜、WebSocket 事件等所有数据模型
import type React from "react";

// 单个 AI 服务提供商的配置项（文本/图像/视频），包含来源、有效性和能力信息
export interface ProjectProviderEntry {
	selected_key: string;
	source: "project" | "default";
	resolved_key: string | null;
	valid: boolean;
	status?: "valid" | "degraded" | "invalid" | null;
	reason_code: string | null;
	reason_message: string | null;
	capabilities?: {
		generate?: boolean | null;
		stream?: boolean | null;
	} | null;
}

// 项目 AI 服务提供商配置，包含文本、图像、视频三个通道的提供商设置
export interface ProjectProviderSettings {
	text: ProjectProviderEntry;
	image: ProjectProviderEntry;
	video: ProjectProviderEntry;
}

// 项目提供商覆盖配置请求体
export interface ProjectProviderOverridesPayload {
	text_provider_override?: string | null;
	image_provider_override?: string | null;
	video_provider_override?: string | null;
}

// 创建项目请求体
export interface CreateProjectPayload extends ProjectProviderOverridesPayload {
	title: string;
	story?: string;
	style?: string;
	target_shot_count?: number;
	character_hints?: string[];
	creation_mode?: string;
	reference_images?: string[];
	universe_id?: number | null;
	chapter_number?: number | null;
	chapter_title?: string | null;
}

// 更新项目请求体，所有字段可选
export type UpdateProjectPayload = Partial<
	Pick<
		Project,
			| "title"
			| "story"
			| "style"
			| "status"
			| "target_shot_count"
			| "character_hints"
			| "creation_mode"
			| "reference_images"
			| "exports"
			| "universe_id"
			| "chapter_number"
			| "chapter_title"
	> &
		ProjectProviderOverridesPayload
>;

// 故事大纲中的单个幕（Act）
export interface StoryOutlineAct {
	act: number;
	title: string;
	summary: string;
}

// 故事大纲，包含类型、主题、背景、基调和分幕结构
export interface StoryOutline {
	logline: string;
	genre: string[];
	themes: string[];
	setting: string;
	tone: string;
	acts: StoryOutlineAct[];
	emotional_arc: string;
}

// 更新故事大纲请求体
export interface StoryOutlineUpdatePayload {
	logline?: string | null;
	genre?: string[] | null;
	themes?: string[] | null;
	setting?: string | null;
	tone?: string | null;
	acts?: StoryOutlineAct[] | null;
	emotional_arc?: string | null;
	visual_bible?: string | null;
	summary?: string | null;
	outline_approved?: boolean | null;
}

// 项目类型
// 项目完整数据模型，包含元数据、故事内容、状态和关联配置
export interface Project {
	id: number;
	title: string;
	story: string | null;
	style: string | null;
	summary: string | null; // 剧情摘要
	story_outline?: StoryOutline | null;
	visual_bible?: string | null;
	outline_approved?: boolean;
	video_url: string | null; // 最终拼接视频
	status: string;
	target_shot_count: number | null;
	character_hints: string[];
	creation_mode: string | null;
	reference_images: string[];
	exports?: string[];
	created_at: string;
	updated_at: string;
	provider_settings: ProjectProviderSettings;
	universe_id?: number | null;
	chapter_number?: number | null;
	chapter_title?: string | null;
}

// 角色数据模型，包含名称、描述、形象图和审批状态
export interface Character {
	id: number;
	project_id: number;
	name: string;
	description: string | null;
	image_url: string | null;
	reference_images?: string[];
	has_embedding?: boolean;
	visual_notes?: string | null;
	approval_state: ReviewState;
	approval_version: number;
	approved_at: string | null;
	approved_name: string | null;
	approved_description: string | null;
	approved_image_url: string | null;
}

// 分镜数据模型，包含描述、提示词、图片/视频 URL 和审批状态
export interface Shot {
	id: number;
	project_id: number;
	order: number;
	description: string;
	prompt: string | null; // 视频生成 prompt
	image_prompt: string | null; // 首帧图片生成 prompt
	image_url: string | null; // 首帧图片
	video_url: string | null; // 分镜视频
	duration: number | null;
	camera: string | null;
	motion_note: string | null;
	scene: string | null;
	action: string | null;
	expression: string | null;
	lighting: string | null;
	dialogue: string | null;
	sfx: string | null;
	tts_url?: string | null;
	bgm_type?: string | null;
	seed: number | null;
	character_ids: number[];
	approval_state: ReviewState;
	approval_version: number;
	approved_at: string | null;
	approved_description: string | null;
	approved_prompt: string | null;
	approved_image_prompt: string | null;
	approved_duration: number | null;
	approved_camera: string | null;
	approved_motion_note: string | null;
	approved_scene: string | null;
	approved_action: string | null;
	approved_expression: string | null;
	approved_lighting: string | null;
	approved_dialogue: string | null;
	approved_sfx: string | null;
	approved_character_ids: number[];
}

// 审批状态：草稿、已批准、已过时
export type ReviewState = "draft" | "approved" | "superseded";

// 更新角色请求体
export interface CharacterUpdatePayload {
	name?: string | null;
	description?: string | null;
	image_url?: string | null;
	visual_notes?: string | null;
	reference_images?: string[] | null;
}

// 更新分镜请求体
export interface ShotUpdatePayload {
	order?: number | null;
	description?: string | null;
	prompt?: string | null;
	image_prompt?: string | null;
	duration?: number | null;
	camera?: string | null;
	motion_note?: string | null;
	scene?: string | null;
	action?: string | null;
	expression?: string | null;
	lighting?: string | null;
	dialogue?: string | null;
	sfx?: string | null;
	seed?: number | null;
	character_ids?: number[] | null;
}

// 版本管理实体类型：角色 或 分镜
export type VersionEntityType = "character" | "shot";

// 实体版本快照记录
export interface ArtifactVersion {
	id: number;
	entity_type: VersionEntityType;
	entity_id: number;
	version: number;
	snapshot: Record<string, unknown>;
	trigger: string;
	created_at: string;
}

// 版本列表响应
export interface VersionListRead {
	entity_type: VersionEntityType;
	entity_id: number;
	versions: ArtifactVersion[];
}

// 版本差异项
export interface VersionDiff {
	field_name: string;
	old_value: unknown;
	new_value: unknown;
}

// 版本对比结果
export interface VersionCompareRead {
	entity_type: VersionEntityType;
	entity_id: number;
	from_version: ArtifactVersion;
	to_version: ArtifactVersion;
	diffs: VersionDiff[];
}

// 版本回滚请求体
export interface RollbackRequest {
	entity_type: VersionEntityType;
	entity_id: number;
	target_version: number;
}

// 版本回滚响应
export interface RollbackResponse {
	success: boolean;
	message: string;
	new_version: ArtifactVersion | null;
}

// Agent 运行记录
export interface AgentRun {
	id: number;
	project_id: number;
	status: string;
	current_agent: string | null;
	progress: number;
	error: string | null;
	thread_id: string | null;
	resource_type: string | null;
	resource_id: number | null;
	provider_snapshot?: ProjectProviderSettings | null;
	created_at: string;
	updated_at: string;
}

// 恢复阶段信息
export interface RecoveryStageRead {
	name: string;
	status: "completed" | "current" | "pending" | "blocked";
	artifact_count: number;
}

// 恢复摘要信息，记录运行进度和可恢复阶段
export interface RecoverySummaryRead {
	project_id: number;
	run_id: number;
	thread_id: string;
	current_stage: string;
	next_stage: string | null;
	preserved_stages: string[];
	stage_history: RecoveryStageRead[];
	resumable: boolean;
}

// 恢复控制信息，描述当前恢复状态和可用操作
export interface RecoveryControlRead {
	state: "active" | "recoverable";
	detail: string;
	available_actions: Array<"resume" | "cancel">;
	thread_id: string;
	active_run: AgentRun;
	recovery_summary: RecoverySummaryRead;
}

// 运行进度事件数据
export interface RunProgressEventData {
	run_id: number;
	project_id?: number;
	current_agent?: string | null;
	current_stage?: string | null;
	stage?: string | null;
	next_stage?: string | null;
	progress: number;
	recovery_summary?: RecoverySummaryRead | null;
}

// 运行等待确认事件数据
export interface RunAwaitingConfirmEventData {
	run_id: number;
	project_id?: number;
	agent: string;
	gate?: string | null;
	current_stage?: string | null;
	stage?: string | null;
	next_stage?: string | null;
	recovery_summary: RecoverySummaryRead;
	preserved_stages?: string[];
	message?: string | null;
	completed?: string | null;
	next_step?: string | null;
	question?: string | null;
	auto_mode?: boolean;
	story_outline?: StoryOutline | null;
	visual_bible?: string | null;
}

// 运行开始事件数据
export interface RunStartedEventData {
	run_id: number;
	project_id?: number;
	provider_snapshot?: ProjectProviderSettings | null;
	current_stage?: string | null;
	stage?: string | null;
	next_stage?: string | null;
	progress?: number;
	current_agent?: string | null;
	recovery_summary?: RecoverySummaryRead | null;
	preserved_stages?: string[];
}

// 运行完成事件数据
export interface RunCompletedEventData {
	run_id?: number;
	project_id?: number;
	current_stage?: string | null;
	current_agent?: string | null;
	message?: string | null;
	video_generation_pending?: boolean | null;
}

// 运行失败事件数据
export interface RunFailedEventData {
	run_id?: number;
	project_id?: number;
	error?: string | null;
	agent?: string | null;
	current_stage?: string | null;
}

// 运行取消事件数据
export interface RunCancelledEventData {
	run_id?: number;
	project_id?: number;
	run_ids?: number[];
	cancelled_count?: number;
}

// 运行确认事件数据
export interface RunConfirmedEventData {
	run_id: number;
	project_id?: number;
	agent: string;
	gate?: string | null;
	current_stage?: string | null;
	stage?: string | null;
	next_stage?: string | null;
	recovery_summary?: RecoverySummaryRead | null;
	auto_mode?: boolean;
}

// 版本创建事件数据
export interface VersionCreatedEventData {
	entity_type: VersionEntityType;
	entity_id: number;
	version: number;
	trigger: string;
}

// 版本回滚事件数据
export interface VersionRollbackEventData {
	entity_type: VersionEntityType;
	entity_id: number;
	from_version: number;
	to_version: number;
}

// WebSocket 事件类型
// WebSocket 事件类型联合
export type WsEventType =
	| "connected"
	| "pong"
	| "echo"
	| "error"
	| "run_started"
	| "run_progress"
	| "run_message"
	| "agent_thinking"
	| "run_completed"
	| "run_failed"
	| "run_awaiting_confirm"
	| "run_confirmed"
	| "run_cancelled"
	| "character_created"
	| "character_updated"
	| "character_deleted"
	| "shot_created"
	| "shot_updated"
	| "shot_deleted"
	| "outline_updated"
	| "project_updated"
	| "data_cleared"
	| "critique_result"
	| "bible_updated"
	| "version_created"
	| "version_rollback"
	| "audio_generated"
	| "export_completed"
	| "consistency_eval_completed";

// WebSocket 事件结构
export interface WsEvent {
	type: WsEventType;
	data: Record<string, unknown>;
}

// 大纲更新事件数据
export interface OutlineUpdatedEventData {
	project_id: number;
	story_outline: StoryOutline | null;
	visual_bible?: string | null;
	outline_approved: boolean;
}

// 审查结果事件数据
export interface CritiqueResultEventData {
	score: number;
	dimensions: Record<string, number>;
	issues: string[];
	suggestions: string[];
	entity_type: string;
	entity_id: number;
	will_regenerate: boolean;
}

// 角色圣经更新事件数据
export interface BibleUpdatedEventData {
	character_id: number;
	visual_notes: boolean;
	reference_images_count: number;
	has_embedding: boolean;
}

// 音频生成完成事件数据
export interface AudioGeneratedEventData {
	shot_id: number;
	tts_url: string | null;
	bgm_type: string | null;
	duration: number | null;
}

// 导出响应
export interface ExportResponse {
	export_id: string;
	project_id: number;
	format: string;
	status: "processing" | "completed" | "failed";
	download_url: string | null;
	created_at: string;
}

// 导出完成事件数据
export interface ExportCompletedEventData {
	export_id: string;
	format: string;
	download_url: string | null;
	status: "completed" | "failed";
	error: string | null;
}

// Agent 思考过程事件数据
export interface AgentThinkingEventData {
	agent: string;
	phase: "reasoning" | "decision" | "planning" | "reviewing";
	content: string;
	details?: string | null;
}

// 角色圣经数据，包含视觉描述、参考图和人脸特征嵌入
export interface CharacterBible {
	character_id: number;
	name: string;
	description: string | null;
	visual_notes: string | null;
	reference_images: string[];
	has_embedding: boolean;
	similarity_scores: Array<{ character_id: number; name: string; similarity: number }>;
}

// Agent 消息，用于前端消息列表展示
export interface AgentMessage {
	id?: string; // 唯一标识符（前端生成）
	agent: string;
	role: string;
	content: string;
	summary?: string; // 摘要（用于确认环节显示）
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	timestamp?: string;
	progress?: number; // 0-1 之间的进度值
	isLoading?: boolean; // 是否正在加载
	phase?: "reasoning" | "decision" | "planning" | "reviewing"; // 思考链阶段
	details?: string | null; // 思考链补充详情
}

// 阻塞镜头信息，描述无法合成的镜头及原因
export interface BlockingClip {
	shot_id: number;
	order: number;
	status: string;
	reason: string;
}

// 项目更新事件数据载荷
export interface ProjectUpdatedPayload {
	id: number;
	title?: string | null;
	story?: string | null;
	style?: string | null;
	summary?: string | null;
	video_url?: string | null;
	status?: string | null;
	target_shot_count?: number | null;
	character_hints?: string[] | null;
	creation_mode?: string | null;
	reference_images?: string[] | null;
	exports?: string[] | null;
	provider_settings?: ProjectProviderSettings | null;
	universe_id?: number | null;
	chapter_number?: number | null;
	chapter_title?: string | null;
	story_outline?: StoryOutline | null;
	visual_bible?: string | null;
	outline_approved?: boolean | null;
	blocking_clips?: BlockingClip[] | null;
}

// 后端消息记录
export interface Message {
	id: number;
	project_id: number;
	run_id: number | null;
	agent: string;
	role: string;
	content: string;
	summary: string | null;
	progress: number | null;
	is_loading: boolean;
	created_at: string;
}

// 工作流阶段类型（与后端 Phase2 graph 对齐）
export type WorkflowStage =
	| "plan"
	| "plan_approval"
	| "render"
	| "render_approval"
	| "compose"
	| "review";

// 配置类型
// 配置值类型，支持字符串、数字、布尔或空值
export type ConfigValue = string | number | boolean | null;

// 后端 API 返回的配置项格式
export interface ConfigItem {
	key: string;
	value: string | null;
	is_sensitive: boolean;
	is_masked: boolean;
	source: "db" | "env" | "default";
}

// 配置分组
export interface ConfigSection {
	key: string;
	title: string;
	items: ConfigItem[];
}

// 应用完整配置（配置项数组）
export type AppConfig = ConfigItem[];

// Agent 名称映射表（英文标识 -> 中文显示名）
export const AGENT_NAME_MAP: Record<string, string> = {
	outline: "大纲",
	plan: "规划",
	character: "角色",
	shot: "分镜",
	compose: "合成",
	review: "审查",
	critic: "质量审查",
};

// 素材资产数据模型
export interface Asset {
	id: number;
	name: string;
	asset_type: "character" | "scene";
	description: string | null;
	image_url: string | null;
	metadata_json: string | null;
	source_project_id: number | null;
	tags: string | null;
	created_at: string;
	updated_at: string;
}

// 素材列表响应
export interface AssetList {
	items: Asset[];
	total: number;
}

// 创建素材请求体
export interface AssetCreatePayload {
	name: string;
	asset_type: "character" | "scene";
	description?: string | null;
	image_url?: string | null;
	metadata_json?: string | null;
	source_project_id?: number | null;
	tags?: string | null;
}

// 风格模板列表响应
export interface StyleTemplateList {
	items: StyleTemplate[];
	total: number;
}

// 风格模板数据模型，定义画面风格、配色和负面提示词
export interface StyleTemplate {
	id: number;
	name: string;
	slug: string;
	category: "builtin" | "custom";
	description: string | null;
	style_prompt: string;
	color_palette: string[];
	negative_prompt: string | null;
	preview_image_url: string | null;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// 创建风格模板请求体
export interface StyleTemplateCreatePayload {
	name: string;
	slug: string;
	description?: string | null;
	style_prompt: string;
	color_palette?: string[];
	negative_prompt?: string | null;
	preview_image_url?: string | null;
}

// 更新风格模板请求体
export interface StyleTemplateUpdatePayload {
	name?: string | null;
	description?: string | null;
	style_prompt?: string | null;
	color_palette?: string[] | null;
	negative_prompt?: string | null;
	preview_image_url?: string | null;
}

// 一致性评估类型
// 人脸匹配详情
export interface FaceMatchDetailRead {
	shot_id: number;
	shot_order: number;
	similarity: number;
	detected: boolean;
}

// 角色一致性评估报告
export interface CharacterConsistencyRead {
	character_id: number;
	character_name: string;
	face_similarity_mean: number;
	face_similarity_std: number;
	presence_rate: number;
	overall_score: number;
	face_matches: FaceMatchDetailRead[];
	grade: string; // A/B/C/D/F
}

// 项目一致性评估结果
export interface ProjectConsistencyRead {
	project_id: number;
	overall_score: number;
	character_reports: CharacterConsistencyRead[];
	evaluated_at: string;
	eval_id?: number;
}

// 一致性评估触发响应
export interface ConsistencyEvalResponse {
	eval_id: number;
	status: string;
}

// 一致性评估报告
export interface ConsistencyReportRead {
	id: number;
	project_id: number;
	overall_score: number;
	created_at: string;
	report_data: ProjectConsistencyRead | null;
}

// 一致性评估完成事件数据
export interface ConsistencyEvalCompletedEventData {
	project_id: number;
	overall_score: number;
	character_count: number;
}

// ── Universe / IP 宇宙 ──────────────────────────────────────

// IP 宇宙数据模型，包含世界观设定和风格规则
export interface Universe {
	id: number;
	name: string;
	description: string | null;
	world_setting: string | null;
	style_rules: string | null;
	cover_image_url: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	projects_count: number;
	shared_characters_count: number;
}

// IP 宇宙详情（包含关联章节和共享角色）
export interface UniverseDetail extends Universe {
	chapters: UniverseProjectLinkRead[];
	shared_characters: SharedCharacterRead[];
}

// 宇宙与项目的关联关系
export interface UniverseProjectLinkRead {
	id: number;
	universe_id: number;
	project_id: number;
	chapter_number: number | null;
	chapter_title: string | null;
	is_main_story: boolean;
	created_at: string;
	project_title: string | null;
}

// 宇宙共享角色数据，跨项目复用的角色形象
export interface SharedCharacterRead {
	id: number;
	universe_id: number;
	name: string;
	description: string | null;
	visual_notes: string | null;
	canonical_image_url: string | null;
	reference_images: string[];
	has_embedding: boolean;
	// face_embedding 不返回给前端（安全考虑）
	character_tags: string | null;
	source_project_id: number | null;
	source_character_id: number | null;
	version: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	reference_images_count: number;
}
