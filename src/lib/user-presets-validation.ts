import { z } from "zod";
import { MAX_USER_PRESETS } from "@/stores/constants";
import type { SavedUserPreset } from "@/types";

const extractionPresetSchema = z.enum([
  "default",
  "tech_notes",
  "discussion",
  "actions",
  "research",
  "technical_docs",
  "release_notes",
]);

const qualitySchema = z.enum(["fast", "balanced", "deep"]);

export const savedUserPresetSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(80),
  extractionPreset: extractionPresetSchema,
  customPrompt: z.string().max(32_000),
  quality: qualitySchema,
});

export const userPresetsBodySchema = z.object({
  presets: z.array(savedUserPresetSchema).max(MAX_USER_PRESETS),
});

export type UserPresetsBody = z.infer<typeof userPresetsBodySchema>;

const userPresetsResponseSchema = z.object({
  presets: z.array(savedUserPresetSchema).max(MAX_USER_PRESETS),
});

/** Ответ GET /api/user/presets и разбор произвольного JSON */
export function parseUserPresetsApiPayload(data: unknown): SavedUserPreset[] {
  const r = userPresetsResponseSchema.safeParse(data);
  return r.success ? r.data.presets : [];
}

/** Массив в колонке `UserPresets.data` (без обёртки `{ presets }`) */
export function parseStoredUserPresetsArray(data: unknown): SavedUserPreset[] {
  const r = z.array(savedUserPresetSchema).max(MAX_USER_PRESETS).safeParse(data);
  return r.success ? r.data : [];
}
