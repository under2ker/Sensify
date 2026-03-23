import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import type { AppState } from "@/stores/app-state";
import { migratePersisted } from "@/stores/migrate-persist";
import { createUiSlice } from "@/stores/slices/ui-slice";
import { createHistorySlice } from "@/stores/slices/history-slice";
import { createSettingsSlice } from "@/stores/slices/settings-slice";

export type { AppState } from "@/stores/app-state";

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createUiSlice(...args),
      ...createHistorySlice(...args),
      ...createSettingsSlice(...args),
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
          try {
            return JSON.parse(raw) as StorageValue<AppState>;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
      migrate: (persisted) => migratePersisted(persisted),
    }
  )
);
