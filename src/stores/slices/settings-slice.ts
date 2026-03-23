import type { StateCreator } from "zustand";
import type { AppState } from "@/stores/app-state";
import { MAX_USER_PRESETS } from "@/stores/constants";
import type { SavedUserPreset } from "@/types";
import { generateId } from "@/lib/utils";

export type SettingsSlice = Pick<
  AppState,
  | "settings"
  | "updateSettings"
  | "userPresets"
  | "setUserPresets"
  | "addUserPreset"
  | "removeUserPreset"
  | "applyUserPreset"
>;

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set, get) => ({
  settings: {
    provider: "groq",
    extractionPreset: "default",
    customPrompt: "",
    groqApiKey: "",
    groqModel: "llama-3.1-8b-instant",
    geminiApiKey: "",
    geminiModel: "gemini-2.0-flash",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3.1",
    notionKey: "",
    notionParentPageId: "",
    quality: "balanced",
    language: "auto",
    theme: "classic-dark",
    webhookUrl: "",
    streaming: true,
    saveToHistory: true,
    shareLinkExpiresDays: null,
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  userPresets: [],
  setUserPresets: (presets) => set({ userPresets: presets }),
  addUserPreset: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, reason: "empty" };
    const { userPresets, settings } = get();
    if (userPresets.length >= MAX_USER_PRESETS) return { ok: false, reason: "limit" };
    const preset: SavedUserPreset = {
      id: generateId(),
      name: trimmed.slice(0, 80),
      extractionPreset: settings.extractionPreset,
      customPrompt: settings.customPrompt ?? "",
      quality: settings.quality,
    };
    set({ userPresets: [preset, ...userPresets] });
    return { ok: true };
  },
  removeUserPreset: (id) =>
    set((state) => ({ userPresets: state.userPresets.filter((p) => p.id !== id) })),
  applyUserPreset: (preset) =>
    set((state) => ({
      settings: {
        ...state.settings,
        extractionPreset: preset.extractionPreset,
        customPrompt: preset.customPrompt,
        quality: preset.quality,
      },
    })),
});
