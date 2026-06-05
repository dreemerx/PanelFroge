// canvas 自定义 shape 的类型定义，包含所有 section shape 和审查快照
import type { TLBaseShape } from "tldraw";
import type { Character, ReviewState, Shot } from "~/types";

// 画布区域通用状态属性
export interface CanvasSectionStatusProps {
	sectionState: string;
	placeholder: boolean;
	statusLabel: string;
	placeholderText: string;
}

// 角色审查状态快照，记录审批版本和批准时的属性
export interface CharacterReviewSnapshot {
	approval_state: ReviewState;
	approval_version: number;
	approved_at: string | null;
	approved_name: string | null;
	approved_description: string | null;
	approved_image_url: string | null;
}

// 带审查信息的角色类型
export type ReviewedCharacter = Character & CharacterReviewSnapshot;

// 镜头审查状态快照，记录审批版本和批准时的属性
export interface ShotReviewSnapshot {
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

// 带审查信息的镜头类型
export type ReviewedShot = Shot & ShotReviewSnapshot;

// shape 类型常量
export const SHAPE_TYPES = {
	STORYBOARD_BOARD: "storyboard-board",
	SCRIPT_SECTION: "script-section",
	CHARACTER_SECTION: "character-section",
	STORYBOARD_SECTION: "storyboard-section",
	VIDEO_SECTION: "video-section",
	PLAN_SECTION: "plan-section",
	COMPOSE_SECTION: "compose-section",
} as const;

// 分镜板块的区域键类型
export type StoryboardBoardSectionKey = "plan" | "render" | "compose";

// 分镜板块 shape 类型，整合规划、渲染、合成三个区域
export type StoryboardBoardShape = TLBaseShape<
	typeof SHAPE_TYPES.STORYBOARD_BOARD,
	{
		w: number;
		h: number;
		projectId: number;
		story: string;
		summary: string;
		characters: ReviewedCharacter[];
		shots: ReviewedShot[];
		videoUrl: string;
		videoTitle: string;
		visibleSections: StoryboardBoardSectionKey[];
		sectionStates: Partial<Record<StoryboardBoardSectionKey, string>>;
		placeholders: Partial<Record<StoryboardBoardSectionKey, boolean>>;
		statusLabels: Partial<Record<StoryboardBoardSectionKey, string>>;
		placeholderTexts: Partial<Record<StoryboardBoardSectionKey, string>>;
		downloadUrl: string;
	}
>;

// 剧本区域 shape，包含故事原文、摘要、角色列表文字版、分镜描述
export type ScriptSectionShape = TLBaseShape<
	typeof SHAPE_TYPES.SCRIPT_SECTION,
	{
		w: number;
		h: number;
		story: string;
		summary: string;
		characters: ReviewedCharacter[];
		shots: ReviewedShot[];
	} & CanvasSectionStatusProps
>;

// 角色设计区域 shape，展示角色图片和审查状态
export type CharacterSectionShape = TLBaseShape<
	typeof SHAPE_TYPES.CHARACTER_SECTION,
	{
		w: number;
		h: number;
		characters: ReviewedCharacter[];
		sectionTitle: string;
	} & CanvasSectionStatusProps
>;

// 分镜图区域 shape，展示各镜头图片和详情
export type StoryboardSectionShape = TLBaseShape<
	typeof SHAPE_TYPES.STORYBOARD_SECTION,
	{
		w: number;
		h: number;
		shots: ReviewedShot[];
		sectionTitle: string;
	} & CanvasSectionStatusProps
>;

// 视频区域 shape，展示最终输出视频
export type VideoSectionShape = TLBaseShape<
	typeof SHAPE_TYPES.VIDEO_SECTION,
	{
		w: number;
		h: number;
		projectId: number;
		videoUrl: string;
		title: string;
		downloadUrl: string;
		previewLabel: string;
		downloadLabel: string;
		retryLabel: string;
		provenanceText: string;
		blockingText: string;
		retryFeedback: string;
		retryRunId: number | null;
		retryThreadId: string | null;
	} & CanvasSectionStatusProps
>;

// 规划区域 shape，展示故事原文、摘要和分镜总览
export type PlanSectionShape = TLBaseShape<
	typeof SHAPE_TYPES.PLAN_SECTION,
	{
		w: number;
		h: number;
		projectId: number;
		story: string;
		summary: string;
		characters: ReviewedCharacter[];
		shots: ReviewedShot[];
	} & CanvasSectionStatusProps
>;

// 合成区域 shape，展示最终合成视频
export type ComposeSectionShape = TLBaseShape<
	typeof SHAPE_TYPES.COMPOSE_SECTION,
	{
		w: number;
		h: number;
		projectId: number;
		videoUrl: string;
		videoTitle: string;
		downloadUrl: string;
	} & CanvasSectionStatusProps
>;

// 扩展 tldraw 全局类型映射
declare module "tldraw" {
	interface TLGlobalShapePropsMap {
		[SHAPE_TYPES.STORYBOARD_BOARD]: StoryboardBoardShape["props"];
		[SHAPE_TYPES.SCRIPT_SECTION]: ScriptSectionShape["props"];
		[SHAPE_TYPES.CHARACTER_SECTION]: CharacterSectionShape["props"];
		[SHAPE_TYPES.STORYBOARD_SECTION]: StoryboardSectionShape["props"];
		[SHAPE_TYPES.VIDEO_SECTION]: VideoSectionShape["props"];
		[SHAPE_TYPES.PLAN_SECTION]: PlanSectionShape["props"];

		[SHAPE_TYPES.COMPOSE_SECTION]: ComposeSectionShape["props"];
	}
}
