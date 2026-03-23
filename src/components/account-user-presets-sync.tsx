"use client";

/**
 * После входа подтягивает «Мои пресеты» с сервера, сливает с локальными (аккаунт приоритетнее),
 * затем с debounce сохраняет изменения в аккаунт.
 */
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { mergeUserPresetsRemoteFirst } from "@/lib/user-presets-merge";
import { parseUserPresetsApiPayload } from "@/lib/user-presets-validation";
import type { SavedUserPreset } from "@/types";

const PUSH_DEBOUNCE_MS = 1600;

export function AccountUserPresetsSync() {
  const { data: session, status } = useSession();
  const userPresets = useAppStore((s) => s.userPresets);
  const setUserPresets = useAppStore((s) => s.setUserPresets);

  const pulledForEmailRef = useRef<string | null>(null);
  const hydratedForEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      pulledForEmailRef.current = null;
      hydratedForEmailRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) {
      return;
    }

    const email = session.user.email;
    if (pulledForEmailRef.current === email) {
      return;
    }

    const ac = new AbortController();
    let cancelled = false;

    void (async () => {
      let remote: SavedUserPreset[] = [];
      let unauthorized = false;
      try {
        const res = await fetch("/api/user/presets", { signal: ac.signal });
        if (res.status === 401) {
          unauthorized = true;
        } else if (res.ok) {
          const data = (await res.json()) as unknown;
          remote = parseUserPresetsApiPayload(data);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
      if (cancelled) return;

      pulledForEmailRef.current = email;
      if (unauthorized) {
        hydratedForEmailRef.current = null;
        return;
      }

      const local = useAppStore.getState().userPresets;
      const merged = mergeUserPresetsRemoteFirst(local, remote);
      hydratedForEmailRef.current = email;
      setUserPresets(merged);
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [status, session?.user?.email, setUserPresets]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) {
      return;
    }
    if (hydratedForEmailRef.current !== session.user.email) {
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          await fetch("/api/user/presets", {
            method: "PUT",
            signal: ac.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ presets: userPresets }),
          });
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
        }
      })();
    }, PUSH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [userPresets, status, session?.user?.email]);

  return null;
}
