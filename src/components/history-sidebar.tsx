"use client";

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
  Sparkles,
  Download,
  Upload,
  MessageCircle,
  Layout,
  Rss,
  Github,
  MessageSquare,
} from "lucide-react";
import { EmptyStateIllustration } from "@/components/empty-state-illustration";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn, formatDate, truncate } from "@/lib/utils";
import type { InputType, LegacySourceType } from "@/types";

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
    }))
  );

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

  const filteredHistory = history.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

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
                    <span className="text-xs text-muted-foreground">
                      ({history.length})
                    </span>
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
                    {history.length > 0 && (
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
                  {filteredHistory.length === 0 ? (
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
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
