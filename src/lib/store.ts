import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import type {
  InputType,
  ExtractionResult,
  ExtractionStatus,
  AppSettings,
  ExportFormat,
  SavedUserPreset,
} from "@/types";
import { generateId } from "@/lib/utils";

interface AppState {
  activeInputTab: InputType;
  setActiveInputTab: (tab: InputType) => void;

  activeOutputTab: string;
  setActiveOutputTab: (tab: string) => void;

  inputValue: string;
  setInputValue: (value: string) => void;

  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;

  status: ExtractionStatus;
  setStatus: (status: ExtractionStatus) => void;

  /** Количество символов при стриминге (для индикатора) */
  streamingChars: number;
  setStreamingChars: (n: number) => void;

  errorMessage: string;
  setErrorMessage: (message: string) => void;
  /** Достигнут ли лимит бесплатных извлечений (402) */
  limitReached: boolean;
  setLimitReached: (v: boolean) => void;
  /** ISO-время следующего сброса дневного лимита (UTC полуночь) */
  limitResetsAt: string | null;
  setLimitResetsAt: (iso: string | null) => void;

  currentResult: ExtractionResult | null;
  setCurrentResult: (result: ExtractionResult | null) => void;
  updateCurrentResult: (updates: Partial<ExtractionResult>) => void;

  /** Сохранённая страница (полный текст статьи для чтения и экспорта) */
  savedPage: { title: string; content: string; source: string } | null;
  setSavedPage: (page: { title: string; content: string; source: string } | null) => void;

  history: ExtractionResult[];
  addToHistory: (result: ExtractionResult) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (id: string) => void;
  importHistory: (items: ExtractionResult[]) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;

  exportTags: string;
  setExportTags: (tags: string) => void;

  exportFilename: string;
  setExportFilename: (filename: string) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  /** Пользовательские пресеты (только локально, persist) */
  userPresets: SavedUserPreset[];
  addUserPreset: (name: string) => { ok: true } | { ok: false; reason: "empty" | "limit" };
  removeUserPreset: (id: string) => void;
  applyUserPreset: (preset: SavedUserPreset) => void;
}

const MAX_USER_PRESETS = 14;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeInputTab: "github",
      setActiveInputTab: (tab) => set({ activeInputTab: tab, inputValue: "" }),

      activeOutputTab: "summary",
      setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),

      inputValue: "",
      setInputValue: (value) => set({ inputValue: value }),

      pdfFile: null,
      setPdfFile: (file) => set({ pdfFile: file }),

      status: "idle",
      setStatus: (status) => set({ status }),

      streamingChars: 0,
      setStreamingChars: (n) => set({ streamingChars: n }),

      errorMessage: "",
      setErrorMessage: (message) => set({ errorMessage: message }),
      limitReached: false,
      setLimitReached: (v) => set({ limitReached: v }),
      limitResetsAt: null,
      setLimitResetsAt: (iso) => set({ limitResetsAt: iso }),


      currentResult: null,
      setCurrentResult: (result) => set({ currentResult: result, savedPage: null }),
      updateCurrentResult: (updates) =>
        set((state) => ({
          currentResult: state.currentResult
            ? { ...state.currentResult, ...updates }
            : null,
        })),

      history: [],
      addToHistory: (result) =>
        set((state) => ({
          history: [result, ...state.history].slice(0, 50),
        })),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
      clearHistory: () => set({ history: [] }),
      importHistory: (items) =>
        set({
          history: (items ?? []).slice(0, 50),
        }),
      loadFromHistory: (id) => {
        const item = get().history.find((h) => h.id === id);
        if (item) {
          set({
            currentResult: item,
            savedPage: null,
            status: "success",
            activeOutputTab: "summary",
          });
        }
      },

      savedPage: null,
      setSavedPage: (page) =>
        set((s) => ({
          savedPage: page,
          ...(page && { currentResult: null }),
        })),

      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      exportFormat: "markdown",
      setExportFormat: (format) => set({ exportFormat: format }),

      exportTags: "",
      setExportTags: (tags) => set({ exportTags: tags }),

      exportFilename: "",
      setExportFilename: (filename) => set({ exportFilename: filename }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      settingsOpen: false,
      setSettingsOpen: (open) => set({ settingsOpen: open }),

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
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      userPresets: [],
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
        set((s) => ({ userPresets: s.userPresets.filter((p) => p.id !== id) })),
      applyUserPreset: (preset) =>
        set((s) => ({
          settings: {
            ...s.settings,
            extractionPreset: preset.extractionPreset,
            customPrompt: preset.customPrompt,
            quality: preset.quality,
          },
        })),
    }),
    {
      name: "sensify-storage",
      partialize: (state) => {
        const { groqApiKey, geminiApiKey, notionKey, ...safeSettings } = state.settings;
        return {
          history: state.history,
          settings: { ...safeSettings, groqApiKey: "", geminiApiKey: "", notionKey: "" },
          exportFormat: state.exportFormat,
          limitReached: state.limitReached,
          limitResetsAt: state.limitResetsAt,
          userPresets: state.userPresets,
        };
      },
      storage: {
        getItem: (name): StorageValue<AppState> | null => {
          const raw = localStorage.getItem(name) ?? localStorage.getItem("pke-storage");
          if (!raw) return null;
          if (name !== "pke-storage" && !localStorage.getItem(name)) {
            localStorage.setItem(name, raw);
          }
          try { return JSON.parse(raw) as StorageValue<AppState>; } catch { return null; }
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
      migrate: (persisted) => {
        const p = persisted as {
          settings?: { theme?: string; extractionPreset?: string; customPrompt?: string; streaming?: boolean };
          history?: { sourceType?: string }[];
          userPresets?: SavedUserPreset[];
        };
        const s = p;
        const presetLegacy: Record<string, string> = {
          study: "tech_notes",
          article: "discussion",
          science: "research",
          business: "default",
          education: "default",
        };
        const validPresets = [
          "default",
          "tech_notes",
          "discussion",
          "actions",
          "research",
          "technical_docs",
          "release_notes",
        ];
        if (s?.settings?.theme === "dark" || s?.settings?.theme === "light") {
          s.settings.theme =
            s.settings.theme === "dark" ? "classic-dark" : "classic-light";
        }
        if (s?.settings?.extractionPreset) {
          const ep = s.settings.extractionPreset;
          if (presetLegacy[ep]) s.settings.extractionPreset = presetLegacy[ep];
        }
        if (s?.settings && (!("extractionPreset" in s.settings) || !validPresets.includes(s.settings.extractionPreset ?? "")))
          s.settings.extractionPreset = "default";
        if (Array.isArray(p.history)) {
          p.history = p.history.map((h) => ({
            ...h,
            sourceType: h.sourceType === "substack" ? "url" : h.sourceType,
          }));
        }
        if (s?.settings && !("customPrompt" in s.settings))
          s.settings.customPrompt = "";
        if (s?.settings && !("streaming" in s.settings))
          s.settings.streaming = true;
        if (s?.settings && !("saveToHistory" in s.settings))
          (s.settings as Record<string, unknown>).saveToHistory = true;
        if (s?.settings && !("geminiApiKey" in s.settings))
          (s.settings as Record<string, unknown>).geminiApiKey = "";
        if (s?.settings && !("geminiModel" in s.settings))
          (s.settings as Record<string, unknown>).geminiModel = "gemini-2.0-flash";
        if (s?.settings && !("notionParentPageId" in s.settings))
          (s.settings as Record<string, unknown>).notionParentPageId = "";
        if (!Array.isArray(p.userPresets)) (p as { userPresets: SavedUserPreset[] }).userPresets = [];
        return persisted as AppState;
      },
    }
  )
);
