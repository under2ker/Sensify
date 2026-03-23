"use client";

import { useCallback, forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Globe,
  FileText,
  Youtube,
  Type,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  MessageCircle,
  Layout,
  Rss,
  Play,
  BookMarked,
  Github,
  MessageSquare,
  Crown,
  BookmarkPlus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import Link from "next/link";
import { cn, isValidUrl, isYouTubeUrl, isTelegramUrl, isNotionUrl, isRssUrl, isGithubUrl, isRedditUrl, findSimilarNotes, truncate } from "@/lib/utils";
import {
  DEMO_WEB_URLS,
  DEMO_GITHUB_URLS,
  DEMO_REDDIT_URLS,
  DEMO_TELEGRAM_URLS,
  DEMO_RSS_URLS,
  DEMO_YOUTUBE_URLS,
  DEMO_NOTION_URLS,
  DEMO_TEXT_SAMPLE,
  pickRandomDemo,
} from "@/lib/demo-work-links";
import { toast } from "sonner";
import type { InputType, ExtractionPreset } from "@/types";
import { isExtractFieldInvalid } from "@/lib/extract-input-validation";

const groqModels = [
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B" },
  { value: "gemma2-9b-it", label: "Gemma 2 9B" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
];

const geminiModels = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

const ollamaModels = ["llama3.1", "llama3.1:70b", "llama3.2", "mistral", "mixtral", "gemma2", "qwen2.5", "phi3", "deepseek-r1"];

const presetOptions: { value: ExtractionPreset; label: string }[] = [
  { value: "default", label: "По умолчанию" },
  { value: "technical_docs", label: "Документация" },
  { value: "discussion", label: "Обсуждение / тред" },
  { value: "tech_notes", label: "Технические заметки" },
  { value: "actions", label: "Задачи (action items)" },
  { value: "research", label: "Исследование / RFC" },
  { value: "release_notes", label: "Релиз / changelog" },
];

/** Рекомендуемый пресет по типу источника */
const recommendedPreset: Record<InputType, ExtractionPreset> = {
  url: "discussion",
  pdf: "research",
  youtube: "discussion",
  telegram: "discussion",
  notion: "tech_notes",
  rss: "discussion",
  github: "technical_docs",
  reddit: "discussion",
  text: "default",
};

const inputTabsMore: { value: InputType; label: string; icon: React.ReactNode }[] = [
  { value: "youtube", label: "YouTube", icon: <Youtube className="w-4 h-4" /> },
  { value: "notion", label: "Notion", icon: <Layout className="w-4 h-4" /> },
];

const inputTabsMain: { value: InputType; label: string; icon: React.ReactNode }[] = [
  { value: "github", label: "GitHub", icon: <Github className="w-4 h-4" /> },
  { value: "reddit", label: "Reddit", icon: <MessageSquare className="w-4 h-4" /> },
  { value: "url", label: "Ссылка", icon: <Globe className="w-4 h-4" /> },
  { value: "telegram", label: "Telegram", icon: <MessageCircle className="w-4 h-4" /> },
  { value: "rss", label: "RSS", icon: <Rss className="w-4 h-4" /> },
  { value: "pdf", label: "PDF", icon: <FileText className="w-4 h-4" /> },
  { value: "text", label: "Текст", icon: <Type className="w-4 h-4" /> },
];

const inputTabs: { value: InputType; label: string; icon: React.ReactNode }[] = [
  ...inputTabsMain,
  ...inputTabsMore,
];

export interface InputPanelRef {
  focusActiveInput: () => void;
}

export const InputPanel = forwardRef<InputPanelRef, { onExtract: () => void }>(
  function InputPanel({ onExtract }, ref) {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const youtubeInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const [savePageLoading, setSavePageLoading] = useState(false);
  const [urlTouched, setUrlTouched] = useState(false);
  const [presetDraft, setPresetDraft] = useState("");
  const {
    activeInputTab,
    setActiveInputTab,
    inputValue,
    setInputValue,
    pdfFile,
    setPdfFile,
    setSavedPage,
    status,
    limitReached,
    limitResetsAt,
    setLimitReached,
    setLimitResetsAt,
    settings,
    updateSettings,
    currentResult,
    history,
    loadFromHistory,
    userPresets,
    addUserPreset,
    removeUserPreset,
    applyUserPreset,
    inputValidationMessage,
    setInputValidationMessage,
  } = useAppStore(
    useShallow((s) => ({
      activeInputTab: s.activeInputTab,
      setActiveInputTab: s.setActiveInputTab,
      inputValue: s.inputValue,
      setInputValue: s.setInputValue,
      pdfFile: s.pdfFile,
      setPdfFile: s.setPdfFile,
      setSavedPage: s.setSavedPage,
      status: s.status,
      limitReached: s.limitReached,
      limitResetsAt: s.limitResetsAt,
      setLimitReached: s.setLimitReached,
      setLimitResetsAt: s.setLimitResetsAt,
      settings: s.settings,
      updateSettings: s.updateSettings,
      currentResult: s.currentResult,
      history: s.history,
      loadFromHistory: s.loadFromHistory,
      userPresets: s.userPresets,
      addUserPreset: s.addUserPreset,
      removeUserPreset: s.removeUserPreset,
      applyUserPreset: s.applyUserPreset,
      inputValidationMessage: s.inputValidationMessage,
      setInputValidationMessage: s.setInputValidationMessage,
    }))
  );

  useEffect(() => {
    setInputValidationMessage(null);
  }, [inputValue, pdfFile, activeInputTab, setInputValidationMessage]);

  const fieldHasError = (tab: InputType) => {
    const v = inputValue.trim();
    if (inputValidationMessage && activeInputTab === tab) return true;
    if (tab === "url") return urlTouched && v.length > 0 && !isValidUrl(v);
    return isExtractFieldInvalid(tab, inputValue, pdfFile);
  };

  const pdfFieldError = Boolean(inputValidationMessage && activeInputTab === "pdf");

  const handleSaveUserPreset = () => {
    const r = addUserPreset(presetDraft);
    if (!r.ok) {
      if (r.reason === "empty") toast.error("Введите имя пресета");
      else toast.error("Сохранено максимум пресетов — удалите лишние");
      return;
    }
    setPresetDraft("");
    toast.success("Пресет сохранён (в этом браузере)");
  };

  const [limitTick, setLimitTick] = useState(0);
  useEffect(() => {
    if (!limitResetsAt || !limitReached) return;
    const end = new Date(limitResetsAt).getTime();
    if (Number.isNaN(end)) return;
    if (Date.now() >= end) {
      setLimitReached(false);
      setLimitResetsAt(null);
      return;
    }
    const id = setInterval(() => {
      setLimitTick((t) => t + 1);
      if (Date.now() >= end) {
        setLimitReached(false);
        setLimitResetsAt(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [limitResetsAt, limitReached, setLimitReached, setLimitResetsAt]);

  function formatLimitCountdown(ms: number): string {
    if (ms <= 0) return "можно снова";
    const s = Math.ceil(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `через ${h} ч ${m} мин`;
    if (m > 0) return `через ${m} мин ${sec} с`;
    return `через ${sec} с`;
  }

  const limitResetLabel =
    limitReached && limitResetsAt
      ? (() => {
          void limitTick;
          const end = new Date(limitResetsAt).getTime();
          const left = end - Date.now();
          const local = new Date(limitResetsAt).toLocaleString("ru-RU", {
            dateStyle: "short",
            timeStyle: "short",
          });
          return { local, countdown: formatLimitCountdown(left) };
        })()
      : null;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setPdfFile(acceptedFiles[0]);
      }
    },
    [setPdfFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleUrlDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const text = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
      if (text) {
        const url = text.split(/\s+/)[0]?.trim() ?? text.trim();
        if (isValidUrl(url) || isYouTubeUrl(url) || isTelegramUrl(url) || isNotionUrl(url) || isRssUrl(url) || isGithubUrl(url) || isRedditUrl(url)) {
          setInputValue(url);
          if (isYouTubeUrl(url)) setActiveInputTab("youtube");
          else if (isTelegramUrl(url)) setActiveInputTab("telegram");
          else if (isNotionUrl(url)) setActiveInputTab("notion");
          else if (isRssUrl(url)) setActiveInputTab("rss");
          else if (isGithubUrl(url)) setActiveInputTab("github");
          else if (isRedditUrl(url)) setActiveInputTab("reddit");
          else setActiveInputTab("url");
        }
      }
    },
    [setInputValue, setActiveInputTab]
  );

  const handleUrlDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSavePage = useCallback(async () => {
    const url = inputValue.trim();
    if (!url || !isValidUrl(url)) {
      toast.error("Введите корректный URL");
      return;
    }
    setSavePageLoading(true);
    try {
      const res = await fetch("/api/save-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setSavedPage({ title: data.title, content: data.content, source: url });
      toast.success("Страница открыта в основном окне");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить страницу");
    } finally {
      setSavePageLoading(false);
    }
  }, [inputValue, setSavedPage]);

  const handleLoadDemoPdf = useCallback(async () => {
    try {
      const res = await fetch("/samples/demo.pdf");
      if (!res.ok) throw new Error("Файл недоступен");
      const blob = await res.blob();
      const file = new File([blob], "demo-sensify.pdf", { type: "application/pdf" });
      setPdfFile(file);
      toast.success("Подставлен демо-PDF (можно сразу извлекать)");
    } catch {
      toast.error("Не удалось загрузить демо-PDF. Проверьте, что файл public/samples/demo.pdf на месте.");
    }
  }, [setPdfFile]);

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

  useImperativeHandle(ref, () => ({
    focusActiveInput: () => {
      if (["url", "github", "reddit", "telegram", "notion", "rss"].includes(activeInputTab)) urlInputRef.current?.focus();
      else if (activeInputTab === "youtube") youtubeInputRef.current?.focus();
      else if (activeInputTab === "text") textInputRef.current?.focus();
    },
  }), [activeInputTab]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <Tabs
        value={activeInputTab}
        onValueChange={(v) => setActiveInputTab(v as InputType)}
        className="flex flex-1 flex-col min-h-0"
      >
        <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col flex-1 min-h-0 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="shrink-0 px-2.5 pt-2 pb-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Источник</p>
            <TabsList className="flex flex-wrap gap-1 h-auto p-0 bg-transparent items-center">
              {inputTabsMain.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
                >
                  <span className="shrink-0 opacity-70 [&_svg]:size-3.5">{tab.icon}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-medium text-muted-foreground transition-all hover:text-foreground hover:bg-muted/50 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      (activeInputTab === "youtube" || activeInputTab === "notion") &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    Ещё
                    <ChevronDown className="size-3.5 opacity-70 shrink-0" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[9rem]">
                  {inputTabsMore.map((tab) => (
                    <DropdownMenuItem
                      key={tab.value}
                      className="text-[11px] cursor-pointer"
                      onSelect={() => setActiveInputTab(tab.value)}
                    >
                      <span className="shrink-0 opacity-70 [&_svg]:size-3.5">{tab.icon}</span>
                      {tab.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 px-2.5 pb-2 overflow-auto overscroll-contain">
          <TabsContent value="url" className="h-full mt-0 focus-visible:outline-none">
            <div
              className="space-y-1.5 rounded-lg border border-dashed border-border/50 p-2 transition-colors hover:border-primary/30"
              onDragOver={handleUrlDragOver}
              onDrop={handleUrlDrop}
              onDragEnter={(e) => e.currentTarget.classList.add("border-primary/50")}
              onDragLeave={(e) => e.currentTarget.classList.remove("border-primary/50")}
            >
              <label className="text-xs text-muted-foreground font-medium">
                Документация, блог, Substack, Medium — любой URL
              </label>
              <input
                ref={urlInputRef}
                type="url"
                placeholder="Вставьте URL (Ctrl+V)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() => setUrlTouched(true)}
                aria-invalid={fieldHasError("url")}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-muted/50 border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  fieldHasError("url")
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border"
                )}
              />
              <p className="text-xs text-muted-foreground">
                MDN, RFC, инженерные блоги, статьи (включая Substack по ссылке)
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(pickRandomDemo(DEMO_WEB_URLS))}
                  className="sm:w-auto"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  Показать работу
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSavePage}
                  disabled={savePageLoading || !inputValue.trim() || !isValidUrl(inputValue.trim())}
                  className="sm:w-auto"
                  title="Сохранить всю страницу в читабельном формате (Markdown)"
                >
                  {savePageLoading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <BookMarked className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  )}
                  Сохранить страницу
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="github" className="h-full mt-0 focus-visible:outline-none">
            <div
              className="space-y-1.5 rounded-lg border border-dashed border-border/50 p-2 transition-colors hover:border-primary/30"
              onDragOver={handleUrlDragOver}
              onDrop={handleUrlDrop}
              onDragEnter={(e) => e.currentTarget.classList.add("border-primary/50")}
              onDragLeave={(e) => e.currentTarget.classList.remove("border-primary/50")}
            >
              <label className="text-xs text-muted-foreground font-medium">
                Ссылка на GitHub — README, issue, discussion
              </label>
              <input
                ref={urlInputRef}
                type="url"
                placeholder="https://github.com/owner/repo или /blob/... /issues/... /discussions/..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-invalid={fieldHasError("github")}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-muted/50 border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  fieldHasError("github") ? "border-destructive focus:ring-destructive/50" : "border-border"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Репозитории, документация, обсуждения
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(pickRandomDemo(DEMO_GITHUB_URLS))}
                  className="sm:w-auto"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  Показать работу
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSavePage}
                  disabled={savePageLoading || !inputValue.trim() || !isGithubUrl(inputValue.trim())}
                  className="sm:w-auto"
                  title="Сохранить страницу в читабельном формате"
                >
                  {savePageLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <BookMarked className="w-3.5 h-3.5 mr-1.5 opacity-70" />}
                  Сохранить страницу
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reddit" className="h-full mt-0 focus-visible:outline-none">
            <div
              className="space-y-1.5 rounded-lg border border-dashed border-border/50 p-2 transition-colors hover:border-primary/30"
              onDragOver={handleUrlDragOver}
              onDrop={handleUrlDrop}
              onDragEnter={(e) => e.currentTarget.classList.add("border-primary/50")}
              onDragLeave={(e) => e.currentTarget.classList.remove("border-primary/50")}
            >
              <label className="text-xs text-muted-foreground font-medium">
                Ссылка на пост или тред Reddit
              </label>
              <input
                ref={urlInputRef}
                type="url"
                placeholder="https://reddit.com/r/subreddit/comments/..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-invalid={fieldHasError("reddit")}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-muted/50 border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  fieldHasError("reddit") ? "border-destructive focus:ring-destructive/50" : "border-border"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Посты, комментарии, обсуждения
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(pickRandomDemo(DEMO_REDDIT_URLS))}
                  className="sm:w-auto"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  Показать работу
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSavePage}
                  disabled={savePageLoading || !inputValue.trim() || !isRedditUrl(inputValue.trim())}
                  className="sm:w-auto"
                  title="Сохранить страницу в читабельном формате"
                >
                  {savePageLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <BookMarked className="w-3.5 h-3.5 mr-1.5 opacity-70" />}
                  Сохранить страницу
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="h-full mt-0 focus-visible:outline-none">
            <div
              {...getRootProps()}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border border-dashed py-4 px-3 transition-all cursor-pointer",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : pdfFieldError
                    ? "border-destructive bg-destructive/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <input {...getInputProps()} />
              <AnimatePresence mode="wait">
                {pdfFile ? (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <FileText className="w-7 h-7 text-primary" />
                    <p className="text-sm font-medium">{pdfFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} МБ
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfFile(null);
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Удалить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLoadDemoPdf();
                        }}
                      >
                        <Play className="w-3 h-3 mr-1 opacity-70" />
                        Демо-PDF
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <Upload className="w-7 h-7 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Перетащите PDF сюда или нажмите для выбора
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Документы, исследования, книги
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleLoadDemoPdf();
                      }}
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      Показать работу
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="youtube" className="h-full mt-0 focus-visible:outline-none">
            <div
              className="space-y-1.5 rounded-lg border border-dashed border-border/50 p-2 transition-colors hover:border-primary/30"
              onDragOver={handleUrlDragOver}
              onDrop={handleUrlDrop}
              onDragEnter={(e) => e.currentTarget.classList.add("border-primary/50")}
              onDragLeave={(e) => e.currentTarget.classList.remove("border-primary/50")}
            >
              <label className="text-xs text-muted-foreground font-medium">
                Ссылка на YouTube — вставьте или перетащите
              </label>
              <input
                ref={youtubeInputRef}
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-invalid={fieldHasError("youtube")}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-muted/50 border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  fieldHasError("youtube") ? "border-destructive focus:ring-destructive/50" : "border-border"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Извлечение из транскрипции / субтитров видео
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputValue(pickRandomDemo(DEMO_YOUTUBE_URLS))}
                className="sm:w-auto"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                Показать работу
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="telegram" className="h-full mt-0 focus-visible:outline-none">
            <div
              className="space-y-1.5 rounded-lg border border-dashed border-border/50 p-2 transition-colors hover:border-primary/30"
              onDragOver={handleUrlDragOver}
              onDrop={handleUrlDrop}
              onDragEnter={(e) => e.currentTarget.classList.add("border-primary/50")}
              onDragLeave={(e) => e.currentTarget.classList.remove("border-primary/50")}
            >
              <label className="text-xs text-muted-foreground font-medium">
                Ссылка на пост или канал Telegram
              </label>
              <input
                ref={urlInputRef}
                type="url"
                placeholder="https://t.me/channel/123 или t.me/c/channelname/456"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-invalid={fieldHasError("telegram")}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-muted/50 border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  fieldHasError("telegram") ? "border-destructive focus:ring-destructive/50" : "border-border"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Публичные посты и каналы
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputValue(pickRandomDemo(DEMO_TELEGRAM_URLS))}
                className="sm:w-auto"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                Показать работу
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notion" className="h-full mt-0 focus-visible:outline-none">
            <div
              className="space-y-1.5 rounded-lg border border-dashed border-border/50 p-2 transition-colors hover:border-primary/30"
              onDragOver={handleUrlDragOver}
              onDrop={handleUrlDrop}
              onDragEnter={(e) => e.currentTarget.classList.add("border-primary/50")}
              onDragLeave={(e) => e.currentTarget.classList.remove("border-primary/50")}
            >
              <label className="text-xs text-muted-foreground font-medium">
                Ссылка на страницу Notion
              </label>
              <input
                ref={urlInputRef}
                type="url"
                placeholder="https://notion.so/workspace/Page-123..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-invalid={fieldHasError("notion")}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-muted/50 border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  fieldHasError("notion") ? "border-destructive focus:ring-destructive/50" : "border-border"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Страница должна быть опубликована для веб-доступа
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputValue(pickRandomDemo(DEMO_NOTION_URLS))}
                className="sm:w-auto"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                Показать работу
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="rss" className="h-full mt-0 focus-visible:outline-none">
            <div
              className="space-y-1.5 rounded-lg border border-dashed border-border/50 p-2 transition-colors hover:border-primary/30"
              onDragOver={handleUrlDragOver}
              onDrop={handleUrlDrop}
              onDragEnter={(e) => e.currentTarget.classList.add("border-primary/50")}
              onDragLeave={(e) => e.currentTarget.classList.remove("border-primary/50")}
            >
              <label className="text-xs text-muted-foreground font-medium">
                Ссылка на RSS или Atom фид
              </label>
              <input
                ref={urlInputRef}
                type="url"
                placeholder="https://example.com/feed.xml или /rss"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-invalid={fieldHasError("rss")}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-muted/50 border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  fieldHasError("rss") ? "border-destructive focus:ring-destructive/50" : "border-border"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Блоги, подкасты, новостные ленты
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputValue(pickRandomDemo(DEMO_RSS_URLS))}
                className="sm:w-auto"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                Показать работу
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="text" className="h-full mt-0 focus-visible:outline-none">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">
                Вставьте контент
              </label>
              <textarea
                ref={textInputRef}
                placeholder="Вставьте статью, заметки или любой текст, из которого хотите извлечь знания..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-invalid={fieldHasError("text")}
                className={cn(
                  "w-full h-28 px-3 py-2 rounded-lg bg-muted/50 border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none",
                  fieldHasError("text") ? "border-destructive focus:ring-destructive/50" : "border-border"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {inputValue.length > 0
                  ? `${inputValue.length} символов`
                  : "Минимум 50 символов"}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInputValue(DEMO_TEXT_SAMPLE)}
                className="sm:w-auto"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                Показать работу
              </Button>
            </div>
          </TabsContent>

          {(() => {
            if (!currentResult) return null;
            const similar = findSimilarNotes(currentResult, history, 4);
            if (similar.length === 0) return null;
            return (
              <div className="mt-2 pt-2 border-t border-border/40">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Похожие заметки</p>
                <div className="flex flex-col gap-1">
                  {similar.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item.id)}
                      className="text-left text-[11px] py-1 px-1.5 rounded-md hover:bg-muted/50 transition-colors truncate border border-transparent hover:border-border"
                    >
                      {truncate(item.title, 45)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          </div>

          <div className="shrink-0 border-t border-border/70 bg-muted/15 px-2.5 py-2 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5 block leading-none">Модель</label>
            <select
              value={settings.provider === "groq" ? settings.groqModel : settings.provider === "gemini" ? settings.geminiModel : settings.ollamaModel}
              onChange={(e) =>
                settings.provider === "groq"
                  ? updateSettings({ groqModel: e.target.value })
                  : settings.provider === "gemini"
                    ? updateSettings({ geminiModel: e.target.value })
                    : updateSettings({ ollamaModel: e.target.value })
              }
              className="w-full h-7 px-2 rounded-md bg-muted/50 border border-border text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              {settings.provider === "groq"
                ? groqModels.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))
                : settings.provider === "gemini"
                  ? geminiModels.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))
                  : (() => {
                      const current = settings.ollamaModel;
                      const list = ollamaModels.includes(current) ? ollamaModels : [current, ...ollamaModels];
                      return list.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ));
                    })()}
            </select>
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5 block leading-none">Пресет</label>
            <select
              value={settings.extractionPreset}
              onChange={(e) => updateSettings({ extractionPreset: e.target.value as ExtractionPreset })}
              className="w-full h-7 px-2 rounded-md bg-muted/50 border border-border text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
            >
              {presetOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 space-y-1.5">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide leading-none">
            Мои пресеты <span className="normal-case opacity-80">(локально)</span>
          </p>
          <div className="flex gap-1">
            <input
              type="text"
              value={presetDraft}
              onChange={(e) => setPresetDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveUserPreset();
                }
              }}
              placeholder="Имя…"
              className="flex-1 min-w-0 h-7 px-2 rounded-md bg-background border border-border text-[11px] placeholder:text-muted-foreground/70"
              maxLength={80}
              aria-label="Имя нового пресета"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={handleSaveUserPreset}
              title="Сохранить: текущий пресет, качество и свой промпт из настроек"
              aria-label="Сохранить пресет"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {userPresets.length > 0 && (
            <ul className="flex flex-wrap gap-1 pt-0.5 list-none m-0 p-0" aria-label="Сохранённые пресеты">
              {userPresets.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-0.5 rounded-full bg-primary/10 pl-2 pr-0.5 py-0.5 text-[10px] border border-primary/15"
                >
                  <button
                    type="button"
                    className="font-medium max-w-[128px] truncate text-left hover:underline"
                    onClick={() => {
                      applyUserPreset(p);
                      toast.success(`Пресет «${p.name}»`);
                    }}
                    title={`Пресет: ${presetOptions.find((o) => o.value === p.extractionPreset)?.label ?? p.extractionPreset}, качество ${p.quality}`}
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    className="p-0.5 rounded-full hover:bg-destructive/15 shrink-0"
                    onClick={() => {
                      removeUserPreset(p.id);
                      toast.info("Пресет удалён");
                    }}
                    aria-label={`Удалить пресет ${p.name}`}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {recommendedPreset[activeInputTab] !== settings.extractionPreset && (
          <div className="flex items-center justify-between gap-1.5 py-0 leading-tight">
            <span className="text-[10px] text-muted-foreground line-clamp-2">
              Для «{inputTabs.find((t) => t.value === activeInputTab)?.label}»: {presetOptions.find((p) => p.value === recommendedPreset[activeInputTab])?.label}
            </span>
            <button
              type="button"
              onClick={() => updateSettings({ extractionPreset: recommendedPreset[activeInputTab] })}
              className="shrink-0 text-[10px] font-medium text-primary hover:underline"
            >
              OK
            </button>
          </div>
        )}
        <label className="flex items-center gap-1.5 cursor-pointer py-0">
          <input
            type="checkbox"
            checked={settings.saveToHistory !== false}
            onChange={(e) => updateSettings({ saveToHistory: e.target.checked })}
            className="rounded border-border text-primary size-3.5 focus:ring-1 focus:ring-primary/50"
          />
          <span className="text-[11px] text-muted-foreground">В историю</span>
        </label>
        {inputValidationMessage ? (
          <p className="text-[11px] font-medium text-destructive leading-snug" role="alert">
            {inputValidationMessage}
          </p>
        ) : null}
        {limitReached && (
          <div
            className="rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-950 dark:text-amber-100/95 leading-snug"
            role="status"
          >
            <p className="font-semibold">Лимит на сегодня</p>
            {limitResetLabel ? (
              <p className="mt-0.5 opacity-90">
                Снова можно отправлять запросы с{" "}
                <span className="font-semibold">{limitResetLabel.local}</span> (локальное время),{" "}
                <span className="font-semibold">{limitResetLabel.countdown}</span>. Счётчик обнуляется в полночь по UTC.
              </p>
            ) : (
              <p className="mt-0.5 opacity-90">
                После полуночи UTC или премиум.
              </p>
            )}
          </div>
        )}
        <div className="flex gap-1.5 pt-0.5">
        <Button
          size="sm"
          className={cn(
            "flex-1 h-9 text-sm font-semibold relative overflow-hidden",
            status === "loading" && "animate-pulse-glow"
          )}
          disabled={!canExtract && !limitReached}
          onClick={limitReached ? () => window.location.assign("/premium") : onExtract}
        >
          <AnimatePresence mode="wait">
            {status === "loading" ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Извлекаю…
              </motion.span>
            ) : status === "success" ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Снова
              </motion.span>
            ) : status === "error" && limitReached ? (
              <motion.span
                key="limit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <Crown className="w-4 h-4" />
                Премиум
              </motion.span>
            ) : status === "error" ? (
              <motion.span
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" />
                Повторить
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Извлечь смысл
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setInputValue("");
            setPdfFile(null);
            setUrlTouched(false);
          }}
          disabled={status === "loading"}
          className="h-9 shrink-0 gap-1 px-2.5"
          title="Очистить поля ввода"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Очистить</span>
        </Button>
        </div>
      </div>
        </div>
      </Tabs>
    </div>
  );
});
