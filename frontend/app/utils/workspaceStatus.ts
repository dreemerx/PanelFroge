// 工作区状态推导工具，根据项目数据和运行状态计算各分区的展示状态
import type { Character, Project, RecoverySummaryRead, Shot } from "~/types";
import { getWorkflowStageUnlockRank } from "~/utils/workflowStage";

// 工作区分区键名：规划、渲染、合成
export type WorkspaceSectionKey =
  | "plan"
  | "render"
  | "compose";

// 工作区分区状态
export type WorkspaceSectionState =
  | "draft"
  | "generating"
  | "blocked"
  | "failed"
  | "complete"
  | "superseded"
  | "waiting-for-review";

// 工作区分区状态信息
export interface WorkspaceSectionStatus {
  key: WorkspaceSectionKey;
  title: string;
  state: WorkspaceSectionState;
  placeholder: boolean;
}

// 工作区状态推导的输入数据
export interface WorkspaceProjectionInput {
  project: Project;
  currentStage: string;
  runState: string;
  characters: Character[];
  shots: Shot[];
  recoverySummary?: RecoverySummaryRead | null;
  videoProviderValid?: boolean | null;
}

// 工作区整体状态
export interface WorkspaceStatus {
  stageLabel: WorkspaceSectionState;
  sections: WorkspaceSectionStatus[];
}

// 根据项目状态和运行参数推导工作区运行状态字符串
export function deriveWorkspaceRunState(input: {
  projectStatus?: string | null;
  isGenerating?: boolean;
  awaitingConfirm?: boolean;
  currentRunId?: number | null;
}): string {
  const { projectStatus, isGenerating = false, awaitingConfirm = false, currentRunId = null } = input;

  if (projectStatus === "failed") {
    return "failed";
  }

  if (awaitingConfirm) {
    return "awaiting_confirm";
  }

  if (isGenerating) {
    return "running";
  }

  if (currentRunId) {
    return "blocked";
  }

  if (projectStatus === "ready" || projectStatus === "completed") {
    return "completed";
  }

  return "draft";
}

// 最终输出区域的展示元数据
export interface WorkspaceFinalOutputMeta {
  sectionState: WorkspaceSectionState;
  statusLabel: string;
  provenanceText: string;
  blockingText: string;
  downloadUrl: string;
  previewLabel: string;
  downloadLabel: string;
  retryLabel: string;
  retryFeedback: string;
  retryRunId: number | null;
  retryThreadId: string | null;
}

// 标准分区定义（规划/渲染/合成）
export const CANONICAL_SECTIONS: Array<Pick<WorkspaceSectionStatus, "key" | "title">> = [
  { key: "plan", title: "规划" },
  { key: "render", title: "渲染" },
  { key: "compose", title: "合成" },
];

const SECTION_STATUS_LABELS: Record<WorkspaceSectionState, string> = {
  draft: "待生成",
  generating: "生成中",
  blocked: "待生成",
  failed: "生成失败",
  complete: "已完成",
  superseded: "已失效",
  "waiting-for-review": "待审核",
};

const SECTION_PLACEHOLDERS: Record<WorkspaceSectionKey, string> = {
  plan: "等待规划生成...",
  render: "等待渲染生成...",
  compose: "等待视频合成...",
};

const SECTION_STAGE_ORDER: Record<WorkspaceSectionKey, number> = {
  plan: 0,
  render: 1,
  compose: 2,
};

// 获取恢复摘要中已保留阶段的最高等级
function getPreservedUnlockRank(recoverySummary?: RecoverySummaryRead | null) {
  if (!recoverySummary?.preserved_stages?.length) {
    return -1;
  }

  return recoverySummary.preserved_stages.reduce((maxRank, stage) => {
    return Math.max(maxRank, getWorkflowStageUnlockRank(stage));
  }, -1);
}

// 获取有效解锁等级（取当前阶段和保留阶段中的最高等级）
function getEffectiveUnlockRank(input: Pick<WorkspaceProjectionInput, "currentStage" | "recoverySummary">) {
  return Math.max(
    getWorkflowStageUnlockRank(input.currentStage),
    getPreservedUnlockRank(input.recoverySummary)
  );
}

// 判断当前是否已到达或超过指定阶段
function isAtOrPastStage(input: Pick<WorkspaceProjectionInput, "currentStage" | "recoverySummary">, targetStage: number) {
  return getEffectiveUnlockRank(input) >= targetStage;
}

// 检查角色列表中是否有已批准的角色
function hasApprovedContent(characters: Character[]) {
  return characters.some((character) => character.approval_state === "approved");
}

// 检查分镜列表中是否有含图片的分镜
function hasStoryboardContent(shots: Shot[]) {
  return shots.some((shot) => Boolean(shot.image_url));
}

// 根据输入数据推导指定分区的状态
function resolveSectionState(input: WorkspaceProjectionInput, key: WorkspaceSectionKey): WorkspaceSectionState {
  const { project, runState, characters, shots } = input;

  if (project.status === "failed" || runState === "failed") {
    return "failed";
  }

  if (runState === "awaiting_confirm") {
    return "waiting-for-review";
  }

	if (runState === "blocked") {
		return "blocked";
	}

	if (key === "plan") {
		if (!project.summary) {
			return "draft";
		}

    return isAtOrPastStage(input, SECTION_STAGE_ORDER[key]) ? "generating" : "draft";
  }

  if (key === "render") {
    const hasContent = characters.length > 0 || hasStoryboardContent(shots);
    if (!hasContent) {
      return isAtOrPastStage(input, SECTION_STAGE_ORDER[key]) ? "generating" : "blocked";
    }

    if (isAtOrPastStage(input, SECTION_STAGE_ORDER[key])) {
      const allDone = hasApprovedContent(characters) && hasStoryboardContent(shots);
      return allDone ? "complete" : "generating";
    }

    return "draft";
  }

	if (project.status === "superseded") {
		return "superseded";
	}

	if (key === "compose") {
		if (project.video_url) {
			return "complete";
		}

		if (input.videoProviderValid === false) {
			return "blocked";
		}

		if (isAtOrPastStage(input, SECTION_STAGE_ORDER[key])) {
			return runState === "running" ? "generating" : "draft";
		}

		return "blocked";
	}

  if (project.video_url) {
    return "complete";
  }

  if (isAtOrPastStage(input, SECTION_STAGE_ORDER[key])) {
    return runState === "running" ? "generating" : "draft";
  }

  return "blocked";
}

// 将运行状态和制品状态转换为工作区分区状态标签
export function toCreatorStageLabel(input: {
  runState: string;
  artifactState?: string | null;
}): WorkspaceSectionState {
  if (input.artifactState === "superseded") {
    return "superseded";
  }

  if (input.runState === "awaiting_confirm") {
    return "waiting-for-review";
  }

  if (input.runState === "blocked") {
    return "blocked";
  }

  if (input.runState === "running") {
    return "generating";
  }

  if (input.runState === "failed") {
    return "failed";
  }

  if (input.runState === "completed") {
    return "complete";
  }

  return "draft";
}

// 构建完整的工作区状态，计算所有可见分区的状态
export function buildWorkspaceStatus(input: WorkspaceProjectionInput): WorkspaceStatus {
  const effectiveUnlockRank = getEffectiveUnlockRank(input);
  const sections = CANONICAL_SECTIONS.filter((section) =>
    isSectionVisible(effectiveUnlockRank, section.key, input)
  ).map((section) => {
    const state = resolveSectionState(input, section.key);
    const placeholder =
      (section.key === "plan" && !input.project.summary) ||
      (section.key === "render" && input.characters.length === 0 && !hasStoryboardContent(input.shots)) ||
      (section.key === "compose" && !input.project.video_url);

    return {
      ...section,
      state,
      placeholder,
    };
  });

  return {
    stageLabel: toCreatorStageLabel({
      runState: input.runState,
      artifactState: input.project.status === "superseded" ? "superseded" : null,
    }),
    sections,
  };
}

// 判断分区是否应当显示
function isSectionVisible(
  effectiveUnlockRank: number,
  key: WorkspaceSectionKey,
  input?: WorkspaceProjectionInput,
) {
  if (key === "plan") {
    return true;
  }

  if (input) {
    if (key === "render" && (input.characters.length > 0 || input.shots.some((s) => Boolean(s.image_url)))) {
      return true;
    }

    if (key === "compose" && input.project.video_url) {
      return true;
    }
  }

  return effectiveUnlockRank >= SECTION_STAGE_ORDER[key];
}

// 获取分区状态的中文显示标签
export function getWorkspaceSectionStatusLabel(state: WorkspaceSectionState | string) {
  return SECTION_STATUS_LABELS[state as WorkspaceSectionState] ?? "待生成";
}

// 根据分区状态返回对应的 CSS badge 类名
export function getWorkspaceSectionStatusBadgeClass(state: WorkspaceSectionState | string) {
  if (state === "complete") {
    return "badge-success";
  }

  if (state === "generating") {
    return "badge-warning";
  }

  if (state === "failed" || state === "superseded") {
    return "badge-error";
  }

  if (state === "waiting-for-review") {
    return "badge-info";
  }

  return "badge-ghost";
}

// 获取分区的占位提示文本
export function getWorkspaceSectionPlaceholderText(key: WorkspaceSectionKey) {
  return SECTION_PLACEHOLDERS[key];
}

// 获取项目最终视频的下载 URL
export function getProjectFinalVideoDownloadUrl(projectId: number) {
  return `/api/v1/projects/${projectId}/final-video`;
}

// 获取最终输出区域的完整展示元数据（状态、来源说明、下载链接等）
export function getWorkspaceFinalOutputMeta(
  input: WorkspaceProjectionInput
): WorkspaceFinalOutputMeta {
  const sectionState = resolveSectionState(input, "compose");
  const runId = input.recoverySummary?.run_id ?? null;
  const threadId = input.recoverySummary?.thread_id ?? null;
  const videoProviderValid = input.videoProviderValid ?? null;

  return {
    sectionState,
    statusLabel: getWorkspaceSectionStatusLabel(sectionState),
    provenanceText: getFinalOutputProvenanceText(sectionState, videoProviderValid),
    blockingText: getFinalOutputBlockingText({
      sectionState,
      videoProviderValid,
    }),
    downloadUrl: getProjectFinalVideoDownloadUrl(input.project.id),
    previewLabel: "预览最终视频",
    downloadLabel: "下载最终视频",
    retryLabel: "重试合成",
    retryFeedback: buildFinalOutputRetryFeedback({
      sectionState,
      runId,
      threadId,
      currentStage: input.currentStage,
      videoProviderValid,
    }),
    retryRunId: runId,
    retryThreadId: threadId,
  };
}

// 获取最终输出的来源说明文本
function getFinalOutputProvenanceText(
  state: WorkspaceSectionState,
  videoProviderValid?: boolean | null,
) {
  if (state === "superseded") {
    return "来源：上一次合成结果，已被新版本替代";
  }

  if (state === "complete") {
    return "来源：当前成片";
  }

  if (state === "failed") {
    return "来源：合成失败，需要重试";
  }

  if (state === "blocked" && videoProviderValid === false) {
    return "来源：本次运行视频 provider 无效，合成已自动跳过";
  }

  if (state === "blocked") {
    return "来源：等待渲染完成后生成最终视频";
  }

  return "来源：等待渲染完成后生成最终视频";
}

// 获取最终输出的阻塞原因说明
function getFinalOutputBlockingText(input: {
  sectionState: WorkspaceSectionState;
  videoProviderValid?: boolean | null;
}) {
  const { sectionState, videoProviderValid } = input;

  if (sectionState === "blocked") {
    if (videoProviderValid === false) {
      return "本次运行的视频 provider 无效，已跳过合成阶段。请先配置可用视频 provider 后重试。";
    }

    return "当前仍在等待渲染完成，完成后会自动生成最终视频。";
  }

  if (sectionState === "superseded") {
    return "当前成片已失效，但仍可预览和下载历史版本。";
  }

  return "";
}

// 构建重试合成的上下文反馈文本
function buildFinalOutputRetryFeedback(input: {
  sectionState: WorkspaceSectionState;
  runId: number | null;
  threadId: string | null;
  currentStage: string;
  videoProviderValid?: boolean | null;
}) {
  const { sectionState, runId, threadId, currentStage, videoProviderValid } = input;

  if (sectionState === "blocked" && videoProviderValid === false) {
    return `视频 provider 无效，当前运行已自动跳过合成。请先在项目中修复视频 provider 后重试。`;
  }

  if (sectionState === "blocked") {
    return `最终视频仍在等待渲染完成，请在 ${currentStage} 之后继续合成。`;
  }

  const contextParts = [
    threadId ? `thread ${threadId}` : null,
    runId ? `run ${runId}` : null,
  ].filter((part): part is string => Boolean(part));

  if (contextParts.length === 0) {
    return "请基于当前最终视频重新合成，保留现有镜头与审批上下文。";
  }

  return `请基于当前最终视频重新合成，沿用 ${contextParts.join(" / ")} 的上下文。`;
}
