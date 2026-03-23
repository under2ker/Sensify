"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

const DARK_THEMES = ["classic-dark", "warm-dark"];
const VALID_THEMES = ["classic-light", "classic-dark", "warm-light", "warm-dark"];

function resolveTheme(theme: string): string {
  if (VALID_THEMES.includes(theme)) return theme;
  if (theme === "auto") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "classic-dark"
      : "classic-light";
  }
  if (theme === "auto-warm") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "warm-dark"
      : "warm-light";
  }
  return "classic-dark";
}

function applyTheme(theme: string) {
  const root = document.documentElement;
  const resolved = resolveTheme(theme);
  root.setAttribute("data-theme", resolved);
  if (DARK_THEMES.includes(resolved)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/** Инициализация темы из localStorage до гидрации (предотвращает мерцание) */
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("sensify-storage") || localStorage.getItem("pke-storage");
    if (raw) {
      const data = JSON.parse(raw);
      let t = data?.state?.settings?.theme;
      if (t === "dark" || t === "light") t = t === "dark" ? "classic-dark" : "classic-light";
      if (t) applyTheme(t);
    }
  } catch {
    applyTheme("classic-dark");
  }
}

/** Применяет тему из настроек к document.documentElement */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.settings.theme);

  useEffect(() => {
    applyTheme(theme);

    if (theme === "auto" || theme === "auto-warm") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme(theme);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return <>{children}</>;
}
