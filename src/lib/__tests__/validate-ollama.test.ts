import { describe, it, expect, afterEach, vi } from "vitest";
import { validateOllamaUrl } from "@/lib/validate";

describe("validateOllamaUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults empty string to localhost", () => {
    vi.stubEnv("OLLAMA_URL_WHITELIST", "");
    expect(validateOllamaUrl("")).toBe("http://localhost:11434");
  });

  it("allows localhost and 127.0.0.1", () => {
    vi.stubEnv("OLLAMA_URL_WHITELIST", "");
    expect(validateOllamaUrl("http://localhost:11434")).toBe("http://localhost:11434");
    expect(validateOllamaUrl("http://127.0.0.1:11434")).toBe("http://127.0.0.1:11434");
  });

  it("rejects private IPv4 without whitelist", () => {
    vi.stubEnv("OLLAMA_URL_WHITELIST", "");
    expect(() => validateOllamaUrl("http://192.168.1.1:11434")).toThrow(/приватные IP/);
  });

  it("allows origin from OLLAMA_URL_WHITELIST", () => {
    vi.stubEnv("OLLAMA_URL_WHITELIST", "http://192.168.1.5:11434");
    expect(validateOllamaUrl("http://192.168.1.5:11434")).toBe("http://192.168.1.5:11434");
  });
});
