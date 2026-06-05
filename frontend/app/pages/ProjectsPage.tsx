// 项目列表页，展示所有项目并支持单选/批量删除操作
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "~/services/api";
import { Card } from "~/components/ui/Card";
import { ConfirmModal } from "~/components/ui/ConfirmModal";
import {
	DocumentTextIcon,
	FaceFrownIcon,
	PencilIcon,
	TrashIcon,
	Cog6ToothIcon,
	MoonIcon,
	SunIcon,
} from "@heroicons/react/24/outline";
import { toast } from "~/utils/toast";
import { ApiError } from "~/types/errors";
import { cleanupDeletedProjectCaches } from "~/features/projects/deleteProject";
import { useThemeStore } from "~/stores/themeStore";
import { useSettingsStore } from "~/stores/settingsStore";

// 项目列表页组件：显示所有项目，支持全选、批量删除和主题切换
export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<number[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { theme, toggleTheme } = useThemeStore();
  const isDark = !theme.endsWith("light");
  const { openModal: openSettingsModal } = useSettingsStore();

  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      const apiError = error instanceof ApiError ? error : null;
      toast.error({
        title: "加载项目列表失败",
        message: apiError?.message || "无法获取项目列表",
        actions: [
          {
            label: "重试",
            onClick: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
          },
        ],
      });
    }
  }, [error, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => projectsApi.deleteMany(ids),
    onSuccess: (_, deletedIds) => {
      cleanupDeletedProjectCaches(queryClient, deletedIds);
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      setDeleteTarget(null);
      toast.success({
        title: "删除成功",
        message: deletedIds.length > 1 ? "项目已批量删除" : "项目已删除",
      });
    },
    onError: (error: Error | ApiError) => {
      const apiError = error instanceof ApiError ? error : null;
      toast.error({
        title: "删除失败",
        message: apiError?.message || error.message || "未知错误",
      });
    },
  });

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteMutation.isPending) return;
    setDeleteTarget([id]);
  };

  const handleBatchDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (deleteMutation.isPending || selectedIds.length === 0) return;
    setDeleteTarget([...selectedIds]);
  };

  const handleToggleSelect = (projectId: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, projectId] : prev.filter((id) => id !== projectId)
    );
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (!projects) return;
    setSelectedIds(checked ? projects.map((project) => project.id) : []);
  };

  const allSelected = projects && projects.length > 0 && selectedIds.length === projects.length;

  const handleConfirmDelete = () => {
    if (deleteTarget !== null && deleteTarget.length > 0) {
      deleteMutation.mutate(deleteTarget);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <header className="flex items-center justify-between px-4 h-10 glass border-b border-base-300/30">
        <Link to="/" className="flex items-center gap-2 text-base font-bold tracking-tight">
          <svg width="18" height="18" viewBox="0 0 32 32" className="flex-shrink-0" aria-hidden="true">
            <defs>
              <linearGradient id="pf-pp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="7" fill="url(#pf-pp-grad)" />
            <path d="M9 8h5v3.5h-1.5v8H9V8zm9 0h5v3.5h-1.5v8H18V8z" fill="#0B0A12" opacity="0.85" />
            <rect x="8" y="22" width="16" height="2" rx="1" fill="#0B0A12" opacity="0.5" />
          </svg>
          <span className="gradient-text">PanelForge</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/" className="btn btn-ghost btn-xs !px-1 !min-h-0 !h-6 text-xs">新建</Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost btn-xs !px-1 !min-h-0 !h-6"
            aria-label={isDark ? "切换亮色" : "切换暗色"}
          >
            {isDark ? <SunIcon className="w-3.5 h-3.5" /> : <MoonIcon className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={openSettingsModal}
            className="btn btn-ghost btn-xs !px-1 !min-h-0 !h-6"
            aria-label="设置"
          >
            <Cog6ToothIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>
      <div className="flex flex-col min-h-[calc(100vh-40px)]">
        <header className="bg-base-100 border-b border-base-300/30 px-6 py-4">
          <h1 className="text-2xl font-heading font-bold">
            <span className="underline-accent">全部项目</span>
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <label className="cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(allSelected)}
                onChange={(e) => handleToggleSelectAll(e.target.checked)}
                disabled={!projects || projects.length === 0}
                className="mr-2 align-middle"
              />
              全选
            </label>
            <button
              type="button"
              className="btn btn-sm btn-error"
              onClick={handleBatchDeleteClick}
              disabled={selectedIds.length === 0}
            >
              批量删除（{selectedIds.length}）
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <PencilIcon className="w-6 h-6 animate-pulse" aria-hidden="true" />
                <p className="text-lg text-base-content/70">加载中...</p>
              </div>
            ) : error ? (
              <Card className="text-center py-8">
                <FaceFrownIcon className="w-6 h-6 mx-auto mb-4" aria-hidden="true" />
                <p className="text-error font-bold">加载项目失败，请重试。</p>
              </Card>
            ) : !projects || projects.length === 0 ? (
              <Card className="text-center py-16">
                <DocumentTextIcon className="w-8 h-8 mx-auto mb-4 text-primary/40" aria-hidden="true" />
                <p className="text-lg font-heading font-bold mb-2">暂无项目</p>
                <p className="text-sm text-base-content/50">开始创作你的第一个故事吧！</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="block"
                  >
                    <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-sm cursor-pointer">
                      <div className="flex items-center justify-between">
                        <label
                          className="mr-2 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(project.id)}
                            onChange={(e) => handleToggleSelect(project.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        </label>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold truncate">
                              {project.title}
                            </span>
                            <span
                              className={`badge badge-sm font-semibold ${
                                project.status === "ready"
                                  ? "bg-success/15 text-success border-success/20"
                                  : project.status === "processing"
                                    ? "bg-warning/15 text-warning border-warning/20 animate-pulse"
                                    : "bg-base-300/50 text-base-content/40 border-base-300/30"
                              }`}
                            >
                              {project.status}
                            </span>
                          </div>
                          {project.story && (
                            <p className="text-sm text-base-content/50 truncate mt-1">
                              {project.story}
                            </p>
                          )}
                        </div>
                        <button
                          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-error/10 rounded-lg transition-all cursor-pointer"
                          onClick={(e) => handleDeleteClick(project.id, e)}
                          title="删除"
                        >
                          <TrashIcon className="w-5 h-5 text-error" />
                        </button>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="删除项目"
        message={`确定要删除选中的${deleteTarget ? deleteTarget.length : 0}个项目吗？删除后将无法恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
