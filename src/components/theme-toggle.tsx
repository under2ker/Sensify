"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/lib/store";

const DARK_THEMES = ["classic-dark", "warm-dark"];

function isDark(theme: string): boolean {
  if (DARK_THEMES.includes(theme)) return true;
  if (theme === "classic-light" || theme === "warm-light") return false;
  if (theme === "auto" || theme === "auto-warm") {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return true;
}

type ThemeValue = "auto" | "auto-warm" | "classic-light" | "classic-dark" | "warm-light" | "warm-dark";

function getOpposite(theme: string, currentlyDark: boolean): ThemeValue {
  const isWarm = theme.includes("warm") || theme === "auto-warm";
  if (currentlyDark) return isWarm ? "warm-light" : "classic-light";
  return isWarm ? "warm-dark" : "classic-dark";
}

export function ThemeToggle() {
  const theme = useAppStore((s) => s.settings.theme);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const handleToggle = () => {
    const dark = isDark(theme);
    updateSettings({
      theme: getOpposite(theme, dark) as
        | "classic-light"
        | "classic-dark"
        | "warm-light"
        | "warm-dark",
    });
  };

  const dark = isDark(theme);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleToggle}
            aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
          >
            {dark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {dark ? "Светлая тема" : "Тёмная тема"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
