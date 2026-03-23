"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  FileText,
  BookMarked,
  Code2,
  Clipboard,
  Tag,
  File,
  Wand2,
  Eye,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import {
  generateExport,
  generateExportForSavedPage,
  downloadFile,
  downloadUint8Array,
  copyToClipboard,
} from "@/lib/exporters";
import { buildExtractionPdf } from "@/lib/export-extraction-pdf";
import { cn, formatExportFilename, truncateExportPreviewForGuest } from "@/lib/utils";
import { fetchHasPremium } from "@/lib/user-premium-client";
import { toast } from "sonner";
import type { ExportFormat } from "@/types";

const exportFormats: {
  value: ExportFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
  pro?: boolean;
}[] = [
  {
    value: "obsidian",
    label: "Obsidian",
    icon: <BookMarked className="w-4 h-4" />,
    description: "Markdown + frontmatter",
    pro: true,
  },
  {
    value: "notion",
    label: "Notion",
    icon: <FileText className="w-4 h-4" />,
    description: "JSON для импорта",
    pro: true,
  },
  {
    value: "markdown",
    label: "Markdown",
    icon: <Code2 className="w-4 h-4" />,
    description: "Чистый markdown файл",
    pro: true,
  },
  {
    value: "clipboard",
    label: "Буфер обмена",
    icon: <Clipboard className="w-4 h-4" />,
    description: "Скопировать всё",
  },
  {
    value: "readable",
    label: "Красивый текст",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Удобный текст для чтения",
  },
];

const PREMIUM_FORMATS: ExportFormat[] = ["obsidian", "notion", "markdown", "pdf"];

/** Макс. символов в предпросмотре без премиума (полный текст — только с подпиской). */
const GUEST_PREVIEW_MAX_CHARS = 920;

const GUEST_PREVIEW_FOOTER = `\n\n${"─".repeat(16)}\nФрагмент предпросмотра. Полный текст в окне и копирование — с подпиской Премиум.\nБез премиума: скачайте «Красивый текст» или используйте «Буфер обмена».\n${"─".repeat(16)}`;

export function ExportPanel() {
  const {
    currentResult,
    savedPage,
    exportFormat,
    setExportFormat,
    exportTags,
    setExportTags,
    exportFilename,
    setExportFilename,
    settings,
  } = useAppStore(
    useShallow((s) => ({
      currentResult: s.currentResult,
      savedPage: s.savedPage,
      exportFormat: s.exportFormat,
      setExportFormat: s.setExportFormat,
      exportTags: s.exportTags,
      setExportTags: s.setExportTags,
      exportFilename: s.exportFilename,
      setExportFilename: s.setExportFilename,
      settings: s.settings,
    }))
  );

  const [hasPremium, setHasPremium] = useState(false);
  const [notionSending, setNotionSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const refreshPremium = useCallback(async () => {
    const ok = await fetchHasPremium();
    setHasPremium(ok);
    return ok;
  }, []);
  useEffect(() => {
    void refreshPremium();
  }, [refreshPremium]);

  useEffect(() => {
    if (previewOpen) void refreshPremium();
  }, [previewOpen, refreshPremium]);

  useEffect(() => {
    if (!hasPremium && PREMIUM_FORMATS.includes(exportFormat)) {
      setExportFormat("readable");
    }
  }, [hasPremium, exportFormat, setExportFormat]);

  useEffect(() => {
    if (savedPage) {
      setExportFilename(formatExportFilename(savedPage.title, new Date().toISOString(), []));
      return;
    }
    if (!currentResult) return;
    const suggestedTags = Array.isArray(currentResult.tags)
      ? currentResult.tags.join(", ")
      : "";
    const suggestedFilename = formatExportFilename(
      currentResult.title,
      currentResult.createdAt,
      currentResult.tags
    );
    setExportTags(suggestedTags);
    setExportFilename(suggestedFilename);
  }, [currentResult?.id, savedPage?.title, setExportTags, setExportFilename]);

  const handleNotionPush = async () => {
    if (!currentResult && !savedPage) return;
    const premiumOk = await fetchHasPremium();
    setHasPremium(premiumOk);
    if (!premiumOk) {
      toast.error("Нужен премиум", {
        action: { label: "Тарифы", onClick: () => window.location.assign("/premium") },
      });
      return;
    }
    const token = settings.notionKey?.trim() ?? "";
    const parent = settings.notionParentPageId?.trim() ?? "";
    if (!token || !parent) {
      toast.error("Заполните Notion в Настройках → Аккаунт (токен и родительская страница)");
      return;
    }
    const tags = exportTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setNotionSending(true);
    try {
      const res = await fetch("/api/integrations/notion/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          savedPage
            ? { notionToken: token, parentPageId: parent, savedPage, extraTags: tags }
            : { notionToken: token, parentPageId: parent, result: currentResult, extraTags: tags }
        ),
      });
      const data = (await res.json()) as {
        error?: string;
        url?: string;
        partial?: boolean;
        partialError?: string;
      };
      if (!res.ok) throw new Error(data.error || "Ошибка Notion");
      toast.success("Страница создана в Notion");
      if (data.partial && data.partialError) {
        toast.error(data.partialError);
      }
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось отправить в Notion");
    } finally {
      setNotionSending(false);
    }
  };

  const handleApplyFromResult = () => {
    if (savedPage) {
      setExportFilename(formatExportFilename(savedPage.title, new Date().toISOString(), []));
      return;
    }
    if (!currentResult) return;
    const tags = Array.isArray(currentResult.tags)
      ? currentResult.tags.join(", ")
      : "";
    const filename = formatExportFilename(
      currentResult.title,
      currentResult.createdAt,
      currentResult.tags
    );
    setExportTags(tags);
    setExportFilename(filename);
  };

  const handleExport = async () => {
    if (!currentResult && !savedPage) return;

    if (PREMIUM_FORMATS.includes(exportFormat)) {
      const ok = await refreshPremium();
      if (!ok) {
        toast.error("Для этого формата нужен премиум", {
          action: {
            label: "Узнать",
            onClick: () => window.location.assign("/premium"),
          },
        });
        setExportFormat("readable");
        return;
      }
    }

    const tags = exportTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const title = savedPage?.title ?? currentResult!.title;
    const createdAt = currentResult?.createdAt ?? new Date().toISOString();
    const resultTags = currentResult?.tags ?? [];
    const filename =
      exportFilename.trim() ||
      formatExportFilename(title, createdAt, tags.length > 0 ? tags : resultTags);

    if (exportFormat === "pdf") {
      try {
        const pdfBytes = savedPage
          ? await buildExtractionPdf({ savedPage, extraTags: tags })
          : await buildExtractionPdf({
              result: currentResult!,
              extraTags: tags,
            });
        downloadUint8Array(pdfBytes, `${filename}.pdf`, "application/pdf");
        toast.success("Скачан PDF");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось собрать PDF");
      }
      return;
    }

    const content = savedPage
      ? generateExportForSavedPage(savedPage, exportFormat, tags, filename)
      : generateExport(currentResult!, exportFormat, tags, filename);

    if (exportFormat === "clipboard") {
      await copyToClipboard(content);
      toast.success("Скопировано в буфер обмена");
    } else {
      const ext =
        exportFormat === "notion"
          ? "json"
          : exportFormat === "readable"
            ? "txt"
            : "md";
      downloadFile(content, filename, ext);
      const formatName =
        exportFormat === "obsidian"
          ? "Obsidian"
          : exportFormat === "notion"
            ? "Notion JSON"
            : exportFormat === "readable"
              ? "Красивый текст"
              : "Markdown";
      toast.success(`Экспортировано как ${formatName}`);
    }
  };

  const exportTagsArr = exportTags.split(",").map((t) => t.trim()).filter(Boolean);
  const previewFilename =
    exportFilename.trim() ||
    formatExportFilename(
      savedPage?.title ?? currentResult?.title ?? "",
      currentResult?.createdAt ?? new Date().toISOString(),
      exportTagsArr
    );
  const previewContent =
    exportFormat === "pdf"
      ? [
          "PDF: файл формируется при нажатии «Скачать» (A4, шрифт с кириллицей).",
          "",
          "Черновик содержания в Markdown:",
          "",
          savedPage
            ? generateExportForSavedPage(savedPage, "markdown", exportTagsArr, previewFilename)
            : currentResult
              ? generateExport(currentResult, "markdown", exportTagsArr, previewFilename)
              : "",
        ].join("\n")
      : savedPage
        ? generateExportForSavedPage(savedPage, exportFormat, exportTagsArr, previewFilename)
        : currentResult
          ? generateExport(currentResult, exportFormat, exportTagsArr, previewFilename)
          : "";

  const displayPreviewContent = useMemo(() => {
    if (hasPremium) return previewContent;
    const cut = truncateExportPreviewForGuest(previewContent, GUEST_PREVIEW_MAX_CHARS);
    return `${cut}${GUEST_PREVIEW_FOOTER}`;
  }, [previewContent, hasPremium]);

  if (!currentResult && !savedPage) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <Download className="w-4 h-4 text-success" />
        </div>
        <h3 className="text-sm font-semibold">Экспорт</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {exportFormats.map((fmt) => {
          const isLocked = fmt.pro && !hasPremium;
          return (
            <button
              key={fmt.value}
              type="button"
              onClick={() => {
                if (isLocked) {
                  toast.error("Для Obsidian, Notion, Markdown и PDF нужен премиум", {
                    action: { label: "Узнать", onClick: () => window.location.assign("/premium") },
                  });
                  return;
                }
                setExportFormat(fmt.value);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border h-[100px] w-full min-w-0 transition-all cursor-pointer text-center box-border",
                exportFormat === fmt.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 ring-inset"
                  : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                  exportFormat === fmt.value
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {fmt.icon}
              </div>
              <div className="flex flex-col items-center justify-center text-center min-w-0 w-full px-1">
                <p className="text-xs font-medium leading-tight flex items-center gap-1 justify-center">
                  {fmt.label}
                  {fmt.pro && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      PRO
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                  {fmt.description}
                </p>
            </div>
          </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs text-muted-foreground font-medium">
              Теги
            </label>
          </div>
          <button
            type="button"
            onClick={handleApplyFromResult}
            className="flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            <Wand2 className="w-3 h-3" />
            Подставить из результата
          </button>
        </div>
        <input
          type="text"
          placeholder="ai, обучение, исследование (через запятую)"
          value={exportTags}
          onChange={(e) => setExportTags(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full gap-2 text-muted-foreground"
        onClick={() => setPreviewOpen(true)}
      >
        <Eye className="w-4 h-4" />
        Предпросмотр перед экспортом
      </Button>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onCopyCapture={!hasPremium ? (e) => e.preventDefault() : undefined}
          onCutCapture={!hasPremium ? (e) => e.preventDefault() : undefined}
        >
          <DialogHeader>
            <DialogTitle>Предпросмотр экспорта</DialogTitle>
            {!hasPremium && (
              <p className="text-xs text-muted-foreground font-normal leading-snug pr-6">
                Без премиума показан фрагмент; копирование из окна отключено. Полный предпросмотр и
                форматы Obsidian / Notion / Markdown / PDF — с подпиской.
              </p>
            )}
          </DialogHeader>
          <pre
            className={cn(
              "flex-1 overflow-auto text-xs p-4 rounded-lg bg-muted/50 border border-border font-mono whitespace-pre-wrap break-words",
              hasPremium
                ? "select-text cursor-text"
                : "select-none cursor-default"
            )}
            onCopy={!hasPremium ? (e) => e.preventDefault() : undefined}
            onCut={!hasPremium ? (e) => e.preventDefault() : undefined}
            onContextMenu={!hasPremium ? (e) => e.preventDefault() : undefined}
            onDragStart={!hasPremium ? (e) => e.preventDefault() : undefined}
            style={
              hasPremium
                ? undefined
                : {
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    WebkitTouchCallout: "none",
                  }
            }
          >
            {displayPreviewContent}
          </pre>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <File className="w-3.5 h-3.5 text-muted-foreground" />
          <label className="text-xs text-muted-foreground font-medium">
            Имя файла
          </label>
        </div>
        <input
          type="text"
          placeholder="2025-03-16_название-контента"
          value={exportFilename}
          onChange={(e) => setExportFilename(e.target.value)}
          className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
        />
      </div>

      <Button
        variant="success"
        size="lg"
        className="w-full font-semibold justify-center flex flex-col items-center gap-0.5 h-auto py-3 whitespace-normal text-center"
        onClick={handleExport}
      >
        <span className="flex items-center gap-2">
          <Download className="w-4 h-4 flex-shrink-0" />
          {exportFormat === "clipboard" ? "Скопировать" : "Скачать"}
        </span>
        {exportFormat !== "clipboard" && (
          <span className="text-xs font-medium opacity-90 text-center min-w-0 break-words px-1">
            {exportFormats.find((f) => f.value === exportFormat)?.label}
          </span>
        )}
      </Button>

      {hasPremium && (
        <div className="space-y-1.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full font-medium gap-2"
            disabled={notionSending}
            onClick={() => void handleNotionPush()}
          >
            {notionSending ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <FileText className="w-4 h-4 shrink-0" />
            )}
            Отправить в Notion
          </Button>
          {(!settings.notionKey?.trim() || !settings.notionParentPageId?.trim()) && (
            <p className="text-[10px] text-center text-muted-foreground leading-snug px-1">
              Укажите токен и страницу-родителя в{" "}
              <span className="font-medium text-foreground/80">Настройки → Аккаунт</span>
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
