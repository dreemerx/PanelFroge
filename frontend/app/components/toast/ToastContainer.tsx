// 全局 Toast 通知容器，在页面右上角堆叠显示通知消息
import { useToastStore } from "~/stores/toast.store";
import { Toast } from "./Toast";

// Toast 容器组件：从全局 store 读取通知并渲染
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}
