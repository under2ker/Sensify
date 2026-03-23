import type { StateCreator } from "zustand";
import type { AppState } from "@/stores/app-state";
import type { ExtractionResult } from "@/types";

export type HistorySlice = Pick<
  AppState,
  | "history"
  | "addToHistory"
  | "removeFromHistory"
  | "clearHistory"
  | "loadFromHistory"
  | "importHistory"
  | "togglePinHistoryItem"
  | "trashHistoryItem"
  | "restoreHistoryItem"
  | "emptyTrash"
  | "searchQuery"
  | "setSearchQuery"
>;

export const createHistorySlice: StateCreator<AppState, [], [], HistorySlice> = (set, get) => ({
  history: [],
  addToHistory: (result: ExtractionResult) =>
    set((state) => ({
      history: [
        {
          ...result,
          isPinned: result.isPinned ?? false,
          deletedAt: result.deletedAt ?? undefined,
        },
        ...state.history,
      ].slice(0, 50),
    })),
  removeFromHistory: (id) =>
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
    })),
  clearHistory: () => set({ history: [] }),
  importHistory: (items) =>
    set({
      history: (items ?? []).slice(0, 50).map((h) => ({
        ...h,
        isPinned: h.isPinned ?? false,
        deletedAt: h.deletedAt ?? undefined,
      })),
    }),
  togglePinHistoryItem: (id) =>
    set((state) => ({
      history: state.history.map((h) =>
        h.id === id ? { ...h, isPinned: !(h.isPinned ?? false) } : h,
      ),
    })),
  trashHistoryItem: (id) =>
    set((state) => ({
      history: state.history.map((h) =>
        h.id === id ? { ...h, deletedAt: new Date().toISOString() } : h,
      ),
    })),
  restoreHistoryItem: (id) =>
    set((state) => ({
      history: state.history.map((h) => (h.id === id ? { ...h, deletedAt: undefined } : h)),
    })),
  emptyTrash: () =>
    set((state) => ({
      history: state.history.filter((h) => !h.deletedAt),
    })),
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

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
});
