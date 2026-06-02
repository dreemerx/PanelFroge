import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "panel" | "panel-light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "panel",
      toggleTheme: () => {
        const newTheme = get().theme === "panel" ? "panel-light" : "panel";
        document.documentElement.setAttribute("data-theme", newTheme);
        set({ theme: newTheme });
      },
      setTheme: (theme: Theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
    }),
    {
      name: "panelforge-theme",
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    }
  )
);
