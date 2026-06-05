// 设置弹窗状态管理，控制设置面板的打开/关闭
import { create } from "zustand";

// 设置弹窗状态接口
interface SettingsState {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
