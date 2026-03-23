import type { AppState } from "@/stores/app-state";
import type { SavedUserPreset } from "@/types";

/** Миграция rehydrate из localStorage (`sensify-storage` / legacy `pke-storage`). */
export function migratePersisted(persisted: unknown): AppState {
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
    s.settings.theme = s.settings.theme === "dark" ? "classic-dark" : "classic-light";
  }
  if (s?.settings?.extractionPreset) {
    const ep = s.settings.extractionPreset;
    if (presetLegacy[ep]) s.settings.extractionPreset = presetLegacy[ep];
  }
  if (
    s?.settings &&
    (!("extractionPreset" in s.settings) || !validPresets.includes(s.settings.extractionPreset ?? ""))
  )
    s.settings.extractionPreset = "default";
  if (Array.isArray(p.history)) {
    p.history = p.history.map((h) => ({
      ...h,
      sourceType: h.sourceType === "substack" ? "url" : h.sourceType,
      isPinned:
        typeof (h as { isPinned?: unknown }).isPinned === "boolean"
          ? (h as { isPinned: boolean }).isPinned
          : false,
      deletedAt:
        typeof (h as { deletedAt?: unknown }).deletedAt === "string"
          ? (h as { deletedAt: string }).deletedAt
          : undefined,
    }));
  }
  if (s?.settings && !("customPrompt" in s.settings)) s.settings.customPrompt = "";
  if (s?.settings && !("streaming" in s.settings)) s.settings.streaming = true;
  if (s?.settings && !("saveToHistory" in s.settings))
    (s.settings as Record<string, unknown>).saveToHistory = true;
  if (s?.settings && !("shareLinkExpiresDays" in s.settings))
    (s.settings as Record<string, unknown>).shareLinkExpiresDays = null;
  if (s?.settings && !("geminiApiKey" in s.settings))
    (s.settings as Record<string, unknown>).geminiApiKey = "";
  if (s?.settings && !("geminiModel" in s.settings))
    (s.settings as Record<string, unknown>).geminiModel = "gemini-2.0-flash";
  if (s?.settings && !("notionParentPageId" in s.settings))
    (s.settings as Record<string, unknown>).notionParentPageId = "";
  if (!Array.isArray(p.userPresets)) (p as { userPresets: SavedUserPreset[] }).userPresets = [];
  return persisted as AppState;
}
