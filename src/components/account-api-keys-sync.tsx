"use client";

/**
 * Сразу после появления сессии подтягивает API-ключи Groq/Gemini из аккаунта в zustand,
 * чтобы не ждать открытия «Настроек» (раньше fetch был только там).
 */
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import type { AppSettings } from "@/types";

export function AccountApiKeysSync() {
  const { data: session, status } = useSession();
  const updateSettings = useAppStore((s) => s.updateSettings);
  const syncedForEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      syncedForEmailRef.current = null;
    }
    if (status !== "authenticated" || !session?.user?.email) {
      return;
    }

    const email = session.user.email;
    if (syncedForEmailRef.current === email) {
      return;
    }

    const ac = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const [groqRes, geminiRes] = await Promise.all([
          fetch("/api/user/groq-key", { signal: ac.signal }),
          fetch("/api/user/gemini-key", { signal: ac.signal }),
        ]);
        const groqData = (await groqRes.json()) as { groqApiKey?: string | null };
        const geminiData = (await geminiRes.json()) as {
          geminiApiKey?: string | null;
        };
        if (cancelled) return;

        const partial: Partial<AppSettings> = {};
        if (groqData.groqApiKey && typeof groqData.groqApiKey === "string") {
          partial.groqApiKey = groqData.groqApiKey;
        }
        if (
          geminiData.geminiApiKey &&
          typeof geminiData.geminiApiKey === "string"
        ) {
          partial.geminiApiKey = geminiData.geminiApiKey;
        }
        if (Object.keys(partial).length > 0) {
          updateSettings(partial);
        }
        syncedForEmailRef.current = email;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        /* сеть / 401 — оставляем локальные настройки */
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [status, session?.user?.email, updateSettings]);

  return null;
}
