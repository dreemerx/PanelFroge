// 工作流阶段工具函数，处理后端细粒度阶段名称到前端简化名称的映射
import type { WorkflowStage } from "~/types";

// 工作流阶段顺序定义
export const WORKFLOW_STAGE_SEQUENCE: WorkflowStage[] = [
	"plan",
	"plan_approval",
	"render",
	"render_approval",
	"compose",
	"review",
];

const WORKFLOW_STAGE_SET = new Set<WorkflowStage>(WORKFLOW_STAGE_SEQUENCE);

const WORKFLOW_STAGE_UNLOCK_RANK: Record<WorkflowStage, number> = {
	plan: 0,
	plan_approval: 0,
	render: 1,
	render_approval: 1,
	compose: 2,
	review: -1,
};

// 后端发送细粒度阶段名（如 "plan_characters"、"render_shots"、"compose_merge"），
// 前端 UI 使用简化名称，此映射表将所有细粒度名称归并为 UI 级别名称
const GRANULAR_TO_SIMPLIFIED: Record<string, WorkflowStage> = {
	// plan phase
	plan_outline: "plan",
	outline_approval: "plan_approval",
	plan_characters: "plan",
	plan_shots: "plan",
	characters_approval: "plan_approval",
	shots_approval: "plan_approval",
	// render phase
	render_characters: "render",
	render_shots: "render",
	character_images_approval: "render_approval",
	shot_images_approval: "render_approval",
	critique_character_images: "render",
	critique_shot_images: "render",
	// compose phase
	compose_videos: "compose",
	compose_merge: "compose",
	add_audio: "compose",
	compose_approval: "compose",
	// passthrough for already-simplified names
	plan: "plan",
	plan_approval: "plan_approval",
	render: "render",
	render_approval: "render_approval",
	compose: "compose",
	review: "review",
};

// 将任意阶段字符串（后端细粒度名称或前端简化名称）解析为 UI 使用的简化 WorkflowStage
export function toSimplifiedStage(value: unknown): WorkflowStage | undefined {
	if (typeof value !== "string") return undefined;
	return GRANULAR_TO_SIMPLIFIED[value];
}

// 判断值是否为合法的 WorkflowStage
export function isWorkflowStage(value: unknown): value is WorkflowStage {
	return (
		typeof value === "string" && WORKFLOW_STAGE_SET.has(value as WorkflowStage)
	);
}

// 从 WebSocket 事件数据中解析阶段，优先取 stage 字段，其次 current_stage 字段
export function resolveEventStage(
	data: Record<string, unknown>,
): WorkflowStage | undefined {
	const raw = data.stage ?? data.current_stage;
	return toSimplifiedStage(raw);
}

// 获取工作流阶段的解锁等级（用于判断是否已推进到某阶段）
export function getWorkflowStageUnlockRank(
	stage: string | null | undefined,
): number {
	if (!isWorkflowStage(stage)) {
		return -1;
	}

	return WORKFLOW_STAGE_UNLOCK_RANK[stage];
}

// 获取工作流阶段的显示标题和描述文本
export function getWorkflowStageInfo(stage: WorkflowStage): {
	title: string;
	description: string;
} {
	switch (stage) {
		case "plan":
		case "plan_approval":
			return {
				title: "规划阶段",
				description: "正在生成剧本、角色与镜头规划",
			};
		case "render":
		case "render_approval":
			return {
				title: "渲染阶段",
				description: "正在生成角色形象图和分镜首帧图",
			};
		case "compose":
			return {
				title: "合成阶段",
				description: "正在生成视频片段并合成最终视频",
			};
		case "review":
			return {
				title: "反馈修订",
				description: "正在根据反馈决定从哪个阶段继续",
			};
	}
}
