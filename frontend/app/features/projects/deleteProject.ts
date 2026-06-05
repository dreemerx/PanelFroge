// 项目删除后的缓存清理工具，清除 React Query 中与已删除项目相关的所有缓存
import type { QueryClient } from "@tanstack/react-query";

// 清除已删除项目的查询缓存（项目列表、角色、分镜、消息等）
export function cleanupDeletedProjectCaches(
  queryClient: QueryClient,
  deletedIds: number[]
) {
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  for (const deletedId of deletedIds) {
    queryClient.removeQueries({ queryKey: ["project", deletedId] });
    queryClient.removeQueries({ queryKey: ["characters", deletedId] });
    queryClient.removeQueries({ queryKey: ["shots", deletedId] });
    queryClient.removeQueries({ queryKey: ["messages", deletedId] });
  }
}
