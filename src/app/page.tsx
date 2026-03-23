"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useShallow } from "zustand/react/shallow";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Settings,
  Download,
  X,
  Crown,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { InputPanel, type InputPanelRef } from "@/components/input-panel";

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div
      className="animate-pulse rounded-xl border border-border bg-muted/25 p-6 space-y-3 min-h-[200px]"
      aria-busy="true"
      aria-label={label}
    >
      <div className="h-4 bg-muted rounded-md w-1/3" />
      <div className="h-3 bg-muted rounded-md w-2/3" />
      <div className="h-28 bg-muted rounded-md" />
    </div>
  );
}

const LazyOutputPanel = dynamic(
  () =>
    import("@/components/output-panel").then((m) => ({ default: m.OutputPanel })),
  { loading: () => <PanelSkeleton label="Загрузка панели результата" /> }
);

const LazyExportPanel = dynamic(
  () =>
    import("@/components/export-panel").then((m) => ({ default: m.ExportPanel })),
  {
    loading: () => (
      <div
        className="h-40 animate-pulse rounded-xl bg-muted/25 border border-border"
        aria-busy="true"
        aria-label="Загрузка панели экспорта"
      />
    ),
  }
);

const LazyHistorySidebar = dynamic(
  () =>
    import("@/components/history-sidebar").then((m) => ({
      default: m.HistorySidebar,
    })),
  { ssr: false, loading: () => null }
);

const SettingsDialog = dynamic(
  () =>
    import("@/components/settings-dialog").then((m) => ({
      default: m.SettingsDialog,
    })),
  { ssr: false }
);
import { Footer } from "@/components/footer";
import { BackgroundEffects } from "@/components/background-effects";
import { useAppStore } from "@/lib/store";
import { generateId, isValidUrl, isYouTubeUrl, isTelegramUrl, isNotionUrl, isRssUrl, isGithubUrl, isRedditUrl } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ExtractedLink } from "@/types";
import { normalizeCodeSnippets } from "@/lib/extract/normalize-code-snippets";

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession();
  const inputPanelRef = useRef<{ focusActiveInput: () => void }>(null);
  const abortRef = useRef<AbortController | null>(null);
  const {
    activeInputTab,
    inputValue,
    pdfFile,
    status,
    setStatus,
    setErrorMessage,
    setLimitReached,
    setLimitResetsAt,
    setCurrentResult,
    addToHistory,
    setSidebarOpen,
    setSettingsOpen,
    settings,
    currentResult,
    savedPage,
    setStreamingChars,
  } = useAppStore(
    useShallow((s) => ({
      activeInputTab: s.activeInputTab,
      inputValue: s.inputValue,
      pdfFile: s.pdfFile,
      status: s.status,
      setStatus: s.setStatus,
      setErrorMessage: s.setErrorMessage,
      setLimitReached: s.setLimitReached,
      setLimitResetsAt: s.setLimitResetsAt,
      setCurrentResult: s.setCurrentResult,
      addToHistory: s.addToHistory,
      setSidebarOpen: s.setSidebarOpen,
      setSettingsOpen: s.setSettingsOpen,
      settings: s.settings,
      currentResult: s.currentResult,
      savedPage: s.savedPage,
      setStreamingChars: s.setStreamingChars,
    }))
  );

  const maxRetries = 2;

  const handleReExtract = async (content: string, preset: string, sourceLabel: string) => {
    setStatus("loading");
    setErrorMessage("");
    setLimitReached(false);
    setLimitResetsAt(null);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sourceType: "text",
          source: sourceLabel,
          quality: settings.quality,
          extractionPreset: preset,
          language: settings.language,
          provider: settings.provider,
          groqApiKey: settings.provider === "groq" ? settings.groqApiKey : undefined,
          groqModel: settings.provider === "groq" ? settings.groqModel : undefined,
          geminiApiKey: settings.provider === "gemini" ? settings.geminiApiKey : undefined,
          geminiModel: settings.provider === "gemini" ? settings.geminiModel : undefined,
          ollamaUrl: settings.provider === "ollama" ? settings.ollamaUrl : undefined,
          ollamaModel: settings.provider === "ollama" ? settings.ollamaModel : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 402) {
          setLimitReached(true);
          if (typeof data.resetsAt === "string") setLimitResetsAt(data.resetsAt);
        }
        throw new Error(data.error || "Ошибка извлечения");
      }
      const result = {
        id: generateId(),
        title: data.title,
        source: data.source || sourceLabel,
        sourceType: "text" as const,
        createdAt: new Date().toISOString(),
        summary: data.summary,
        keyIdeas: data.keyIdeas,
        flashcards: data.flashcards,
        structuredNotes: data.structuredNotes,
        tags: data.tags || [],
        language: data.language || "ru",
        imageUrl: currentResult?.imageUrl ?? null,
        extractedLinks: (data.extractedLinks as ExtractedLink[] | undefined) ?? currentResult?.extractedLinks ?? [],
        codeSnippets: normalizeCodeSnippets(data.codeSnippets),
      };
      setCurrentResult(result);
      if (settings.saveToHistory !== false) addToHistory(result);
      setStatus("success");
      setLimitResetsAt(null);
      toast.success("Повторное извлечение готово!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ошибка извлечения";
      setStatus("error");
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleExtract = async (retryCount = 0) => {
    setStatus("loading");
    setErrorMessage("");
    setLimitReached(false);
    setLimitResetsAt(null);

    try {
      let content = "";
      let source = "";

      if (["url", "github", "reddit", "youtube", "telegram", "notion", "rss"].includes(activeInputTab)) {
        source = inputValue.trim();
        content = "";
      } else if (activeInputTab === "pdf" && pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        const pdfResponse = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });
        const pdfData = await pdfResponse.json();
        if (!pdfResponse.ok) throw new Error(pdfData.error);
        content = pdfData.text;
        source = pdfFile.name;
      } else if (activeInputTab === "text") {
        content = inputValue.trim();
        source = "Вставленный текст";
      }

      const body = {
        content,
        sourceType: activeInputTab,
        source,
        quality: settings.quality,
        extractionPreset: settings.extractionPreset,
        customPrompt: settings.customPrompt?.trim() || undefined,
        language: settings.language,
        provider: settings.provider,
        groqApiKey: settings.provider === "groq" ? settings.groqApiKey : undefined,
        groqModel: settings.provider === "groq" ? settings.groqModel : undefined,
        geminiApiKey: settings.provider === "gemini" ? settings.geminiApiKey : undefined,
        geminiModel: settings.provider === "gemini" ? settings.geminiModel : undefined,
        ollamaUrl: settings.provider === "ollama" ? settings.ollamaUrl : undefined,
        ollamaModel: settings.provider === "ollama" ? settings.ollamaModel : undefined,
        stream: settings.streaming ?? true,
      };

      if (body.stream) {
        setStreamingChars(0);
        abortRef.current = new AbortController();
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });
        if (!response.ok) {
          const err = (await response.json().catch(() => ({}))) as {
            error?: string;
            resetsAt?: string;
          };
          if (response.status === 402) {
            setLimitReached(true);
            if (typeof err.resetsAt === "string") setLimitResetsAt(err.resetsAt);
          }
          throw new Error(err.error || "Ошибка извлечения");
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Нет потока ответа");
        const decoder = new TextDecoder();
        let buffer = "";
        let chars = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\n/);
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let obj: {
              t?: string;
              c?: string;
              r?: Record<string, unknown>;
              source?: string;
              imageUrl?: string | null;
              extractedLinks?: ExtractedLink[];
              e?: string;
            };
            try {
              obj = JSON.parse(line);
            } catch {
              continue;
            }
            if (obj.t === "chunk") {
              chars += (obj.c || "").length;
              setStreamingChars(chars);
            } else if (obj.t === "result") {
                const data = obj.r as Record<string, unknown>;
                const result = {
                  id: generateId(),
                  title: (data?.title as string) ?? "",
                  source: obj.source || source,
                  sourceType: activeInputTab,
                  createdAt: new Date().toISOString(),
                  summary: (data?.summary as string) ?? "",
                  keyIdeas: (data?.keyIdeas as string[]) ?? [],
                  flashcards: (data?.flashcards as { question: string; answer: string }[]) ?? [],
                  structuredNotes: (data?.structuredNotes as string) ?? "",
                  tags: (data?.tags as string[]) ?? [],
                  language: (data?.language as string) || "ru",
                  imageUrl: obj.imageUrl ?? null,
                  extractedLinks: obj.extractedLinks ?? [],
                  codeSnippets: normalizeCodeSnippets(data?.codeSnippets),
                };
                setCurrentResult(result);
                if (settings.saveToHistory !== false) addToHistory(result);
                setStatus("success");
                setLimitResetsAt(null);
                setStreamingChars(0);
                toast.success("Знания успешно извлечены!");
                if (settings.webhookUrl?.trim()) {
                  fetch(settings.webhookUrl.trim(), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(result),
                  }).catch(() => {});
                }
                return;
            } else if (obj.t === "error") {
              throw new Error(obj.e || "Ошибка");
            }
          }
        }
        setStreamingChars(0);
        throw new Error("Стрим завершился без результата");
      }

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setLimitReached(true);
          if (typeof data.resetsAt === "string") setLimitResetsAt(data.resetsAt);
        }
        throw new Error(data.error || "Ошибка извлечения");
      }

      const result = {
        id: generateId(),
        title: data.title,
        source: data.source || source,
        sourceType: activeInputTab,
        createdAt: new Date().toISOString(),
        summary: data.summary,
        keyIdeas: data.keyIdeas,
        flashcards: data.flashcards,
        structuredNotes: data.structuredNotes,
        tags: data.tags || [],
        language: data.language || "ru",
        imageUrl: data.imageUrl ?? null,
        extractedLinks: (data.extractedLinks as ExtractedLink[] | undefined) ?? [],
        codeSnippets: normalizeCodeSnippets(data.codeSnippets),
      };

      setCurrentResult(result);
      if (settings.saveToHistory !== false) addToHistory(result);
      setStatus("success");
      setLimitResetsAt(null);
      toast.success("Знания успешно извлечены!");

      if (settings.webhookUrl?.trim()) {
        fetch(settings.webhookUrl.trim(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        }).catch(() => {});
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus("idle");
        setStreamingChars(0);
        setErrorMessage("");
        toast.info("Извлечение отменено");
        return;
      }
      const message =
        error instanceof Error ? error.message : "Что-то пошло не так";
      setStatus("error");
      setStreamingChars(0);
      setErrorMessage(message);

      const isRetryable =
        message.includes("сеть") ||
        message.includes("timeout") ||
        message.includes("ECONNREFUSED") ||
        message.includes("fetch failed") ||
        message.includes("429") ||
        message.includes("503") ||
        message.includes("502");

      if (isRetryable && retryCount < maxRetries) {
        toast.error(`${message} Повторная попытка через 3 сек...`);
        setTimeout(() => handleExtract(retryCount + 1), 3000);
      } else {
        const friendlyMsg =
          message.includes("401") || message.includes("API-ключ")
            ? "Проверьте API-ключ Groq в настройках"
            : message.includes("ECONNREFUSED") || message.includes("Ollama")
            ? "Ollama не запущена. Запустите ollama serve или переключитесь на Groq"
            : message.includes("429")
            ? "Превышен лимит запросов. Подождите минуту"
            : message;
        toast.error(friendlyMsg);
      }
    }
  };

  const canExtract =
    status !== "loading" &&
    ((activeInputTab === "url" && inputValue.trim() && isValidUrl(inputValue.trim())) ||
      (activeInputTab === "github" && inputValue.trim() && isGithubUrl(inputValue.trim())) ||
      (activeInputTab === "reddit" && inputValue.trim() && isRedditUrl(inputValue.trim())) ||
      (activeInputTab === "pdf" && pdfFile) ||
      (activeInputTab === "youtube" && inputValue.trim() && isYouTubeUrl(inputValue.trim())) ||
      (activeInputTab === "telegram" && inputValue.trim() && isTelegramUrl(inputValue.trim())) ||
      (activeInputTab === "notion" && inputValue.trim() && isNotionUrl(inputValue.trim())) ||
      (activeInputTab === "rss" && inputValue.trim() && isRssUrl(inputValue.trim())) ||
      (activeInputTab === "text" && inputValue.trim().length > 50));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        inputPanelRef.current?.focusActiveInput();
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canExtract) {
        e.preventDefault();
        handleExtract();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canExtract]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-background" aria-hidden />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)] pointer-events-none" aria-hidden />
      <div className="particles-bg fixed inset-0 -z-10 pointer-events-none opacity-40" aria-hidden />
      <header className="site-header-main" role="banner">
        <div className="relative mx-auto flex h-16 max-w-[1600px] items-center px-3 sm:px-4">
          {/* Слева: меню + навигация */}
          <div className="relative z-20 flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setSidebarOpen(true)}
              aria-label="Открыть историю"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <nav
              className="hidden min-w-0 items-center gap-0.5 md:flex"
              aria-label="Основная навигация"
            >
              <Link
                href="/"
                className="rounded-full px-2.5 py-2 text-xs font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white lg:px-3"
              >
                Главная
              </Link>
              <Link
                href="/about"
                className="rounded-full px-2.5 py-2 text-xs font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white lg:px-3"
              >
                О проекте
              </Link>
              <Link
                href="/changelog"
                className="rounded-full px-2.5 py-2 text-xs font-medium text-white/65 transition-colors hover:bg-white/10 hover:text-white lg:px-3"
              >
                Changelog
              </Link>
            </nav>
          </div>

          {/* По центру: текстовый логотип */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Link
              href="/"
              className="pointer-events-auto rounded-2xl px-3 py-1 transition-colors hover:bg-white/5"
              aria-label="Sensify — на главную"
            >
              <span
                className="block text-center text-xl font-extrabold tracking-[-0.05em] text-white sm:text-2xl md:text-3xl md:tracking-[-0.04em]"
                style={{
                  textShadow:
                    "0 1px 2px rgba(0,0,0,0.45), 0 0 22px rgba(125,211,252,0.22), 0 0 1px rgba(255,255,255,0.45)",
                }}
              >
                Sensify
              </span>
            </Link>
          </div>

          {/* Справа */}
          <div className="relative z-20 flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/premium">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full border-amber-400/35 bg-amber-500/15 px-2.5 text-amber-200 hover:bg-amber-500/25 hover:text-amber-50"
                >
                  <Crown className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-medium">Премиум</span>
                </Button>
              </Link>
              {sessionStatus !== "loading" &&
                (session ? (
                  <>
                    <Link href="/profile">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white"
                      >
                        Профиль
                      </Button>
                    </Link>
                    {session.user?.isAdmin && (
                      <Link href="/admin">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-amber-400/35 bg-amber-500/10 text-xs text-amber-100 hover:bg-amber-500/20"
                        >
                          Админ
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white"
                    >
                      Вход
                    </Button>
                  </Link>
                ))}
            </div>
            <div className="[&_button]:text-white [&_button:hover]:bg-white/10 [&_svg]:text-white">
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setSettingsOpen(true)}
              title="Настройки"
              aria-label="Настройки"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-[1600px] mx-auto w-full outline-none"
      >
        <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full md:w-[360px] flex-shrink-0 border-b md:border-b-0 md:border-r border-border p-3 md:p-3 flex flex-col min-h-0 md:overflow-hidden overflow-auto"
          >
            <div
              className="brand-surface mb-2 shrink-0 space-y-1 pl-3 pr-2 py-2"
              aria-labelledby="home-intro-heading"
            >
              <p id="home-intro-heading" className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Для разработчиков
              </p>
              <p className="text-xs font-medium text-foreground leading-snug">
                Репозитории, треды, доки и RSS → заметки
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Пресет и экспорт — внизу панели; Obsidian / Notion /{" "}
                <span className="font-medium text-foreground/90">webhook</span> — в настройках.
              </p>
            </div>
            <div className="flex-1 min-h-0 flex flex-col md:min-h-[200px]">
              <InputPanel ref={inputPanelRef} onExtract={handleExtract} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 min-w-0 p-5 overflow-auto min-h-[400px]"
          >
            <LazyOutputPanel
              onReExtract={handleReExtract}
              onCancel={() => abortRef.current?.abort()}
            />
          </motion.div>

          {(currentResult || savedPage) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full max-w-xs flex-shrink-0 border-l border-border p-5 overflow-auto hidden lg:block"
            >
              <LazyExportPanel />
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
      {(currentResult || savedPage) && <MobileExportButton />}
      <LazyHistorySidebar />
      <SettingsDialog />
    </div>
  );
}

function MobileExportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-success text-success-foreground shadow-lg shadow-success/30 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        aria-label="Открыть экспорт"
      >
        <Download className="w-5 h-5" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-5 max-h-[80vh] overflow-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">Экспорт</h3>
                <button onClick={() => setOpen(false)} className="cursor-pointer" aria-label="Закрыть">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <LazyExportPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
