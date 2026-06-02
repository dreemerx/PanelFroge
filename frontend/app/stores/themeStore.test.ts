import { describe, it, expect, vi } from "vitest";

vi.mock("zustand/middleware", () => ({
  persist: (fn: any) => fn,
}));

// Import after mock so persist is a no-op (no localStorage needed)
const { useThemeStore } = await import("./themeStore");

describe("themeStore", () => {
  it("defaults to panel theme", () => {
    expect(useThemeStore.getState().theme).toBe("panel");
  });

  it("toggleTheme switches to panel-light", () => {
    useThemeStore.getState().setTheme("panel");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("panel-light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("panel-light");
  });

  it("toggleTheme toggles back to panel", () => {
    useThemeStore.getState().setTheme("panel-light");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("panel");
    expect(document.documentElement.getAttribute("data-theme")).toBe("panel");
  });

  it("setTheme sets specific theme", () => {
    useThemeStore.getState().setTheme("panel-light");
    expect(useThemeStore.getState().theme).toBe("panel-light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("panel-light");
  });
});
