import { MAX_USER_PRESETS } from "@/stores/constants";
import type { SavedUserPreset } from "@/types";

function presetDedupeKey(p: SavedUserPreset): string {
  return [
    p.name.trim().toLowerCase(),
    p.extractionPreset,
    p.quality,
    p.customPrompt.trim(),
  ].join("\0");
}

/**
 * Учётные пресеты первыми, затем локальные, которых нет на сервере (по содержимому).
 * Обрезка до MAX_USER_PRESETS.
 */
export function mergeUserPresetsRemoteFirst(
  local: SavedUserPreset[],
  remote: SavedUserPreset[]
): SavedUserPreset[] {
  const seen = new Set(remote.map(presetDedupeKey));
  const out: SavedUserPreset[] = [...remote];
  for (const p of local) {
    if (out.length >= MAX_USER_PRESETS) break;
    const k = presetDedupeKey(p);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out.slice(0, MAX_USER_PRESETS);
}
