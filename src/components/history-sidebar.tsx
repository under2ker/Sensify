"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Search,
  Trash2,
  Globe,
  FileText,
  Youtube,
  Type,
  X,
  ChevronLeft,
  Download,
  Upload,
  MessageCircle,
  Layout,
  Rss,
  Github,
  MessageSquare,
  Bookmark,
  RotateCcw,
  Share2,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/empty-state-illustration";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn, formatDate, truncate } from "@/lib/utils";
import type { InputType, LegacySourceType } from "@/types";

type HistorySidebarTab = "recent" | "saved" | "trash" | "shared";

type RemoteShareRow = { id: string; title: string; createdAt: string; expiresAt: string | null };

const sourceIcons: Record<InputType, React.ReactNode> = {
  url: <Globe className="w-3.5 h-3.5" />,
  pdf: <FileText className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
  text: <Type className="w-3.5 h-3.5" />,
  telegram: <MessageCircle className="w-3.5 h-3.5" />,
  notion: <Layout className="w-3.5 h-3.5" />,
  rss: <Rss className="w-3.5 h-3.5" />,
  github: <Github className="w-3.5 h-3.5" />,
  reddit: <MessageSquare className="w-3.5 h-3.5" />,
};

function historySourceIcon(t: InputType | LegacySourceType): React.ReactNode {
  if (t === "substack") return <Globe className="w-3.5 h-3.5" />;
  return sourceIcons[t] ?? <Globe className="w-3.5 h-3.5" />;
}

export function HistorySidebar() {
  const [historyTab, setHistoryTab] = useState<HistorySidebarTab>("recent");
  const { data: session, status: sessionStatus } = useSession();
  const [shareSummaries, setShareSummaries] = useState<RemoteShareRow[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const {
    history,
    searchQuery,
    setSearchQuery,
    loadFromHistory,
    removeFromHistory,
    clearHistory,
    importHistory,
    currentResult,
    sidebarOpen,
    setSidebarOpen,
    togglePinHistoryItem,
    trashHistoryItem,
    restoreHistoryItem,
    emptyTrash,
  } = useAppStore(
    useShallow((s) => ({
      history: s.history,
      searchQuery: s.searchQuery,
      setSearchQuery: s.setSearchQuery,
      loadFromHistory: s.loadFromHistory,
      removeFromHistory: s.removeFromHistory,
      clearHistory: s.clearHistory,
      importHistory: s.importHistory,
      currentResult: s.currentResult,
      sidebarOpen: s.sidebarOpen,
      setSidebarOpen: s.setSidebarOpen,
      togglePinHistoryItem: s.togglePinHistoryItem,
      trashHistoryItem: s.trashHistoryItem,
      restoreHistoryItem: s.restoreHistoryItem,
      emptyTrash: s.emptyTrash,
    }))
  );

  const { recentList, savedList, trashList } = useMemo(() => {
    const recent = history.filter((h) => !h.deletedAt && !h.isPinned);
    const saved = history.filter((h) => !h.deletedAt && h.isPinned);
    const trash = history.filter((h) => Boolean(h.deletedAt));
    return { recentList: recent, savedList: saved, trashList: trash };
  }, [history]);

  const tabSource =
    historyTab === "recent" ? recentList : historyTab === "saved" ? savedList : trashList;

  const filteredHistory = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tabSource
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tabSource, searchQuery]);

  const trashCount = trashList.length;

  useEffect(() => {
    if (!sidebarOpen || sessionStatus !== "authenticated") {
      if (!sidebarOpen) setShareSummaries([]);
      return;
    }
    let cancelled = false;
    setSharesLoading(true);
    fetch("/api/user/shares")
      .then((res) => res.json())
      .then((body: { items?: RemoteShareRow[] }) => {
        if (cancelled) return;
        setShareSummaries(Array.isArray(body.items) ? body.items : []);
      })
      .catch(() => {
        if (!cancelled) setShareSummaries([]);
      })
      .finally(() => {
        if (!cancelled) setSharesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sidebarOpen, sessionStatus, historyTab]);

  const shareCount = sessionStatus === "authenticated" ? shareSummaries.length : 0;

  const handleExport = () => {
    const data = JSON.stringify({ history, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensify-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("История экспортирована");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as { history?: unknown[] };
        const items = Array.isArray(data?.history) ? data.history : [];
        if (items.length === 0) {
          toast.error("Файл пустой или некорректен");
          return;
        }
        importHistory(items as import("@/types").ExtractionResult[]);
        toast.success(`Импортировано ${items.length} записей`);
      } catch {
        toast.error("Ошибка при чтении файла");
      }
    };
    input.click();
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 z-50 bg-card border-r border-border flex flex-col"
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">История</h3>
                    <span className="text-xs text-muted-foreground">({history.length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Экспорт истории (JSON)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleImport}>
                          <Upload className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Импорт истории (JSON)</TooltipContent>
                    </Tooltip>
                    {historyTab === "trash" && trashCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => {
                          emptyTrash();
                          toast.success("Корзина очищена");
                        }}
                      >
                        Очистить корзину
                      </Button>
                    )}
                    {historyTab === "recent" && history.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={clearHistory}
                      >
                        Очистить всё
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {historyTab !== "shared" && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Поиск по истории..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-9 pr-8 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-0.5 mt-2 rounded-lg bg-muted/40 p-0.5">
                  {(
                    [
                      { id: "recent" as const, label: "Недавние", count: recentList.length },
                      { id: "saved" as const, label: "Сохранённые", count: savedList.length },
                      { id: "trash" as const, label: "Корзина", count: trashCount },
                      { id: "shared" as const, label: "Ссылки", count: shareCount },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setHistoryTab(t.id)}
                      className={cn(
                        "rounded-md px-1.5 py-1.5 text-[10px] font-medium transition-colors text-left leading-tight",
                        historyTab === t.id
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t.id === "shared" && (
                        <Share2 className="inline w-3 h-3 mr-0.5 opacity-70 align-[-2px]" aria-hidden />
                      )}
                      {t.label}
                      <span className="text-muted-foreground/80">
                        {" "}
                        {t.id === "shared" && sharesLoading ? "…" : t.count}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 mt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={handleExport}>
                        <Download className="w-3 h-3" />
                        Экспорт
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Скачать историю в JSON</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 text-xs gap-1" onClick={handleImport}>
                        <Upload className="w-3 h-3" />
                        Импорт
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Загрузить историю из JSON</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-2">
                <AnimatePresence>
                  {historyTab === "shared" ? (
                    <div className="px-1 py-2 space-y-2">
                      {sessionStatus !== "authenticated" ? (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Войдите в аккаунт — здесь появятся созданные вами{" "}
                          <strong className="text-foreground/90">публичные ссылки</strong> (кнопка «Поделиться» в
                          результате).
                        </p>
                      ) : sharesLoading ? (
                        <p className="text-xs text-muted-foreground">Загрузка…</p>
                      ) : shareSummaries.length === 0 ? (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Пока нет ссылок. После извлечения нажмите «Поделиться» — запись появится здесь.
                        </p>
                      ) : (
                        shareSummaries.map((row) => {
                          const expired =
                            row.expiresAt != null && new Date(row.expiresAt).getTime() < Date.now();
                          return (
                            <Link
                              key={row.id}
                              href={`/s/${row.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "block p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors",
                                expired && "opacity-60"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{truncate(row.title, 44)}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {formatDate(row.createdAt)}
                                    {expired ? " · истекла" : ""}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                      {history.length === 0 ? (
                        <>
                          <EmptyStateIllustration variant="history" />
                          <h4 className="text-sm font-medium text-foreground mb-1">
                            История пуста
                          </h4>
                          <p className="text-xs text-muted-foreground mb-4">
                            Все извлечения появятся здесь
                          </p>
                          <p className="text-[11px] text-muted-foreground/70">
                            Сделайте первое извлечение — URL, PDF, YouTube или текст
                          </p>
                        </>
                      ) : tabSource.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {historyTab === "saved"
                            ? "Нет закреплённых записей. Нажмите закладку у записи в «Недавние»."
                            : historyTab === "trash"
                              ? "Корзина пуста"
                              : "Нет недавних записей"}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Ничего не найдено по запросу
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredHistory.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "group p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99]",
                          currentResult?.id === item.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => {
                          loadFromHistory(item.id);
                          setSidebarOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                              {historySourceIcon(item.sourceType)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">
                                {truncate(item.title, 40)}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatDate(item.createdAt)}
                              </p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            {historyTab === "trash" ? (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        restoreHistoryItem(item.id);
                                        toast.success("Восстановлено");
                                      }}
                                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                                      aria-label="Восстановить"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Восстановить</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromHistory(item.id);
                                      }}
                                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                                      aria-label="Удалить навсегда"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Удалить навсегда</TooltipContent>
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        togglePinHistoryItem(item.id);
                                      }}
                                      className={cn(
                                        "p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity",
                                        item.isPinned && "opacity-100"
                                      )}
                                      aria-label={item.isPinned ? "Снять с сохранённых" : "В сохранённые"}
                                    >
                                      <Bookmark
                                        className={cn(
                                          "w-3.5 h-3.5",
                                          item.isPinned
                                            ? "fill-primary text-primary"
                                            : "text-muted-foreground hover:text-primary"
                                        )}
                                      />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {item.isPinned ? "Снять с сохранённых" : "В сохранённые"}
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        trashHistoryItem(item.id);
                                        toast.success("В корзине");
                                      }}
                                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
                                      aria-label="В корзину"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>В корзину</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
