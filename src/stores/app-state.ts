import type {
  InputType,
  ExtractionResult,
  ExtractionStatus,
  AppSettings,
  ExportFormat,
  SavedUserPreset,
} from "@/types";

/** Полное состояние клиентского стора (см. слайсы в `src/stores/slices/`). */
export interface AppState {
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

  streamingChars: number;
  setStreamingChars: (n: number) => void;

  errorMessage: string;
  setErrorMessage: (message: string) => void;
  limitReached: boolean;
  setLimitReached: (v: boolean) => void;
  limitResetsAt: string | null;
  setLimitResetsAt: (iso: string | null) => void;

  currentResult: ExtractionResult | null;
  setCurrentResult: (result: ExtractionResult | null) => void;
  updateCurrentResult: (updates: Partial<ExtractionResult>) => void;

  savedPage: { title: string; content: string; source: string } | null;
  setSavedPage: (page: { title: string; content: string; source: string } | null) => void;

  history: ExtractionResult[];
  addToHistory: (result: ExtractionResult) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadFromHistory: (id: string) => void;
  importHistory: (items: ExtractionResult[]) => void;
  togglePinHistoryItem: (id: string) => void;
  trashHistoryItem: (id: string) => void;
  restoreHistoryItem: (id: string) => void;
  emptyTrash: () => void;

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

  userPresets: SavedUserPreset[];
  setUserPresets: (presets: SavedUserPreset[]) => void;
  addUserPreset: (name: string) => { ok: true } | { ok: false; reason: "empty" | "limit" };
  removeUserPreset: (id: string) => void;
  applyUserPreset: (preset: SavedUserPreset) => void;

  inputValidationMessage: string | null;
  setInputValidationMessage: (msg: string | null) => void;
}
