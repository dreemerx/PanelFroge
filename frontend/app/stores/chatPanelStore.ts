// 聊天面板状态管理，控制侧边聊天面板的展开/收起（持久化存储）
import { create } from "zustand";
import { persist } from "zustand/middleware";

// 聊天面板状态接口
interface ChatPanelState {
	isOpen: boolean;
	toggle: () => void;
	open: () => void;
	close: () => void;
}

export const useChatPanelStore = create<ChatPanelState>()(
	persist(
		(set) => ({
			isOpen: false,
			toggle: () => set((state) => ({ isOpen: !state.isOpen })),
			open: () => set({ isOpen: true }),
			close: () => set({ isOpen: false }),
		}),
		{
			name: "panelforge-chat-panel",
		}
	)
);
