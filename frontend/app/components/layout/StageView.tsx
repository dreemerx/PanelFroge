// 阶段视图容器，懒加载无限画布组件并提供加载占位
import { lazy, Suspense } from "react";

// StageView 组件的属性接口
interface StageViewProps {
  projectId: number;
}

const InfiniteCanvas = lazy(() =>
  import("~/components/canvas/InfiniteCanvas").then((m) => ({
    default: m.InfiniteCanvas,
  })),
);

// 阶段视图组件：懒加载画布，用于展示项目内容
export function StageView({ projectId }: StageViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-base-100 text-sm text-base-content/60">
          正在加载画布...
        </div>
      }
    >
      <InfiniteCanvas projectId={projectId} />
    </Suspense>
  );
}
