// Toast 通知便捷调用工具，提供 success/error/warning/info 四种快捷方法
import { useToastStore } from "~/stores/toast.store";
import type { ToastAction } from "~/types/errors";

// Toast 选项接口
interface ToastOptions {
  title: string;
  message: string;
  duration?: number;
  actions?: ToastAction[];
  details?: string;
}

export const toast = {
  success: (options: ToastOptions) => {
    useToastStore.getState().addToast({
      type: "success",
      duration: options.duration ?? 3000,
      ...options,
    });
  },

  error: (options: ToastOptions) => {
    useToastStore.getState().addToast({
      type: "error",
      duration: options.duration ?? 5000,
      ...options,
    });
  },

  warning: (options: ToastOptions) => {
    useToastStore.getState().addToast({
      type: "warning",
      duration: options.duration ?? 4000,
      ...options,
    });
  },

  info: (options: ToastOptions) => {
    useToastStore.getState().addToast({
      type: "info",
      duration: options.duration ?? 3000,
      ...options,
    });
  },
};
