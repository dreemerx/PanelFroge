// 工作流管线阶段定义和工具函数
// 工作流阶段管线顺序：规划 -> 渲染 -> 合成
export const STAGE_PIPELINE = [
  { key: "plan", label: "规划", icon: "bulb" as const },
  { key: "render", label: "渲染", icon: "palette" as const },
  { key: "compose", label: "合成", icon: "cube" as const },
] as const;

// 管线阶段键名类型
export type PipelineStageKey = (typeof STAGE_PIPELINE)[number]["key"];

const APPROVAL_STAGE_MAP: Record<string, string> = {
  plan_approval: "plan",
  render_approval: "render",
};

// 获取管线阶段的索引位置（审批阶段自动映射到对应主阶段）
export function getPipelineStageIndex(stage: string): number {
  const mappedStage = APPROVAL_STAGE_MAP[stage] ?? stage;
  return STAGE_PIPELINE.findIndex((s) => s.key === mappedStage);
}

// 判断字符串是否为有效的管线阶段键名
export function isPipelineStage(stage: string): stage is PipelineStageKey {
  return STAGE_PIPELINE.some((s) => s.key === stage);
}
