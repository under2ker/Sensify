import type { StateCreator } from "zustand";
import type { AppState } from "@/stores/app-state";
import type { InputType, ExtractionResult, ExtractionStatus } from "@/types";

export type UiSlice = Pick<
  AppState,
  | "activeInputTab"
  | "setActiveInputTab"
  | "activeOutputTab"
  | "setActiveOutputTab"
  | "inputValue"
  | "setInputValue"
  | "pdfFile"
  | "setPdfFile"
  | "status"
  | "setStatus"
  | "streamingChars"
  | "setStreamingChars"
  | "errorMessage"
  | "setErrorMessage"
  | "limitReached"
  | "setLimitReached"
  | "limitResetsAt"
  | "setLimitResetsAt"
  | "currentResult"
  | "setCurrentResult"
  | "updateCurrentResult"
  | "savedPage"
  | "setSavedPage"
  | "exportFormat"
  | "setExportFormat"
  | "exportTags"
  | "setExportTags"
  | "exportFilename"
  | "setExportFilename"
  | "sidebarOpen"
  | "setSidebarOpen"
  | "settingsOpen"
  | "setSettingsOpen"
  | "inputValidationMessage"
  | "setInputValidationMessage"
>;

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set) => ({
  activeInputTab: "github",
  setActiveInputTab: (tab: InputType) =>
    set({ activeInputTab: tab, inputValue: "", inputValidationMessage: null }),

  activeOutputTab: "summary",
  setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),

  inputValue: "",
  setInputValue: (value) => set({ inputValue: value }),

  pdfFile: null,
  setPdfFile: (file) => set({ pdfFile: file }),

  status: "idle",
  setStatus: (status: ExtractionStatus) => set({ status }),

  streamingChars: 0,
  setStreamingChars: (n) => set({ streamingChars: n }),

  errorMessage: "",
  setErrorMessage: (message) => set({ errorMessage: message }),
  limitReached: false,
  setLimitReached: (v) => set({ limitReached: v }),
  limitResetsAt: null,
  setLimitResetsAt: (iso) => set({ limitResetsAt: iso }),

  currentResult: null,
  setCurrentResult: (result: ExtractionResult | null) =>
    set({ currentResult: result, savedPage: null }),
  updateCurrentResult: (updates) =>
    set((state) => ({
      currentResult: state.currentResult ? { ...state.currentResult, ...updates } : null,
    })),

  savedPage: null,
  setSavedPage: (page) =>
    set(() => ({
      savedPage: page,
      ...(page && { currentResult: null }),
    })),

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

  inputValidationMessage: null,
  setInputValidationMessage: (msg) => set({ inputValidationMessage: msg }),
});
