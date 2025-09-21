import { DEFAULT_SYSTEM_PROMPT } from "./chat";

export const SETTINGS_STORAGE_KEY = "goopui_settings_v1";

export type AppSettings = {
  userName: string;
  defaultSystemPrompt: string;
  autoScroll: boolean;
  showPromptIdeas: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  userName: "Explorer",
  defaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
  autoScroll: true,
  showPromptIdeas: true,
};

export const loadStoredSettings = (): AppSettings => {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_SETTINGS;
    }
    return {
      ...DEFAULT_SETTINGS,
      ...(parsed as Partial<AppSettings>),
    };
  } catch (error) {
    console.error("Failed to parse stored settings", error);
    return DEFAULT_SETTINGS;
  }
};

export const persistSettings = (value: AppSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
};
