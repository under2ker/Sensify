import { describe, expect, it } from "vitest";
import { mergeUserPresetsRemoteFirst } from "@/lib/user-presets-merge";
import { MAX_USER_PRESETS } from "@/stores/constants";
import type { SavedUserPreset } from "@/types";

const p = (id: string, name: string, extra = ""): SavedUserPreset => ({
  id,
  name,
  extractionPreset: "default",
  customPrompt: extra,
  quality: "balanced",
});

describe("mergeUserPresetsRemoteFirst", () => {
  it("puts remote presets first", () => {
    const remote = [p("r1", "A")];
    const local = [p("l1", "B")];
    expect(mergeUserPresetsRemoteFirst(local, remote).map((x) => x.name)).toEqual(["A", "B"]);
  });

  it("skips local duplicates of remote by content key", () => {
    const remote = [p("r1", "Same", "x")];
    const local = [p("l1", "Same", "x"), p("l2", "Other")];
    const m = mergeUserPresetsRemoteFirst(local, remote);
    expect(m).toHaveLength(2);
    expect(m[0].id).toBe("r1");
    expect(m[1].name).toBe("Other");
  });

  it("caps at MAX_USER_PRESETS", () => {
    const remote: SavedUserPreset[] = [];
    for (let i = 0; i < MAX_USER_PRESETS; i++) {
      remote.push(p(`r${i}`, `R${i}`));
    }
    const local = [p("extra", "Extra")];
    expect(mergeUserPresetsRemoteFirst(local, remote)).toHaveLength(MAX_USER_PRESETS);
  });
});
