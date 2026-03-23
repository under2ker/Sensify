"use client";

import { useEffect, useRef, useCallback, memo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Lightbulb,
  CreditCard,
  FileCode2,
  Copy,
  Check,
  Pencil,
  X,
  RotateCcw,
  Share2,
  Globe,
  FileText,
  Youtube,
  Type,
  MessageCircle,
  Layout,
  Rss,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  GitCompare,
  Undo2,
  Redo2,
  Eye,
  FileStack,
  Github,
  Link2,
  ExternalLink,
  Code2,
  AlertCircle,
} from "lucide-react";
import { ExtractionSkeleton } from "@/components/extraction-skeleton";
import { EmptyStateIllustration } from "@/components/empty-state-illustration";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { LazyMarkdownPreview } from "@/components/lazy-markdown-preview";
import { copyToClipboard } from "@/lib/exporters";
import { cn, truncate, getFaviconUrl, shortDisplayUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { ExtractionPreset, ExtractionResult, InputType, LegacySourceType } from "@/types";

const sourceTypeIcons: Record<InputType, React.ReactNode> = {
  url: <Globe className="w-5 h-5" />,
  pdf: <FileText className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  text: <Type className="w-5 h-5" />,
  telegram: <MessageCircle className="w-5 h-5" />,
  notion: <Layout className="w-5 h-5" />,
  rss: <Rss className="w-5 h-5" />,
  github: <Github className="w-5 h-5" />,
  reddit: <MessageSquare className="w-5 h-5" />,
};

function sourceTypeIcon(t: InputType | LegacySourceType): React.ReactNode {
  if (t === "substack") return <Globe className="w-5 h-5" />;
  return sourceTypeIcons[t] ?? <Globe className="w-5 h-5" />;
}

const presetOptions: { value: ExtractionPreset; label: string }[] = [
  { value: "default", label: "По умолчанию" },
  { value: "technical_docs", label: "Документация" },
  { value: "discussion", label: "Обсуждение / тред" },
  { value: "tech_notes", label: "Технические заметки" },
  { value: "actions", label: "Задачи (action items)" },
  { value: "research", label: "Исследование / RFC" },
  { value: "release_notes", label: "Релиз / changelog" },
];

const outputTabs = [
  { value: "summary", label: "Резюме", icon: <BookOpen className="w-4 h-4" /> },
  { value: "ideas", label: "Идеи", icon: <Lightbulb className="w-4 h-4" /> },
  {
    value: "flashcards",
    label: "Карточки",
    icon: <CreditCard className="w-4 h-4" />,
  },
  { value: "notes", label: "Заметки", icon: <FileCode2 className="w-4 h-4" /> },
  { value: "code", label: "Код", icon: <Code2 className="w-4 h-4" /> },
  { value: "links", label: "Ссылки", icon: <Link2 className="w-4 h-4" /> },
];

function groupExtractedLinksByHost(
  links: { href: string; label: string; description?: string }[]
): [string, { href: string; label: string; description?: string }[]][] {
  const map = new Map<string, { href: string; label: string; description?: string }[]>();
  for (const l of links) {
    let host = "Другое";
    try {
      host = new URL(l.href).hostname.replace(/^www\./, "");
    } catch {
      /* ignore */
    }
    const arr = map.get(host) ?? [];
    arr.push(l);
    map.set(host, arr);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "ru"));
}

const SourceFavicon = memo(function SourceFavicon({
  faviconUrl,
  sourceType,
}: {
  faviconUrl: string | null;
  sourceType: InputType | LegacySourceType;
}) {
  const [imgError, setImgError] = useState(false);
  const showImg = faviconUrl && !imgError;
  return (
    <div className="shrink-0 w-10 h-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden text-muted-foreground">
      {showImg ? (
        <img
          src={faviconUrl}
          alt=""
          className="w-6 h-6 object-contain"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="flex items-center justify-center">
          {sourceTypeIcon(sourceType)}
        </span>
      )}
    </div>
  );
});

function ImagePreview({ url }: { url: string }) {
  const [loaded, setLoaded] = useState<"loading" | "ok" | "error">("loading");
  if (loaded === "error") return null;
  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-border bg-muted/30 aspect-video max-h-48">
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded("ok")}
        onError={() => setLoaded("error")}
      />
    </div>
  );
}

const CopyButton = memo(function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(text);
    setCopied(true);
    toast.success("Скопировано в буфер обмена");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 shrink-0 px-2"
      title={copied ? "Скопировано" : "Копировать"}
      aria-label={copied ? "Скопировано" : "Копировать"}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 shrink-0" />
      )}
    </Button>
  );
});

function ShareButton({ result }: { result: ExtractionResult }) {
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const shareLinkExpiresDays = useAppStore((s) => s.settings.shareLinkExpiresDays);

  const handleShare = async () => {
    setLoading(true);
    setShared(false);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result, expiresInDays: shareLinkExpiresDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${data.id}`;
      await copyToClipboard(url);
      setShared(true);
      toast.success("Ссылка скопирована в буфер обмена");
      setTimeout(() => setShared(false), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать ссылку");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      disabled={loading}
      className="gap-1.5"
      title="Поделиться по ссылке"
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : shared ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Share2 className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">{shared ? "Скопировано" : "Поделиться"}</span>
    </Button>
  );
}

const MAX_UNDO = 50;
const MAX_SNAPSHOTS = 5;

function EditableBlock({
  value,
  onSave,
  renderView,
  placeholder = "Введите текст...",
  className = "",
  markdownPreview = false,
}: {
  value: string;
  onSave: (value: string) => void;
  renderView: (value: string) => React.ReactNode;
  placeholder?: string;
  className?: string;
  markdownPreview?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [showPreview, setShowPreview] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pushUndo = useCallback((prev: string) => {
    setUndoStack((s) => [...s.slice(-(MAX_UNDO - 1)), prev]);
    setRedoStack([]);
  }, []);

  const handleDraftChange = useCallback(
    (next: string) => {
      setDraft((prev) => {
        if (prev !== next) pushUndo(prev);
        return next;
      });
    },
    [pushUndo]
  );

  const handleUndo = useCallback(() => {
    setUndoStack((s) => {
      const last = s[s.length - 1];
      if (last == null) return s;
      setRedoStack((r) => [...r, draft]);
      setDraft(last);
      return s.slice(0, -1);
    });
  }, [draft]);

  const handleRedo = useCallback(() => {
    setRedoStack((r) => {
      const next = r[r.length - 1];
      if (next == null) return r;
      setUndoStack((s) => [...s, draft]);
      setDraft(next);
      return r.slice(0, -1);
    });
  }, [draft]);

  const handleSnapshot = useCallback(() => {
    setSnapshots((s) => [...s.slice(-(MAX_SNAPSHOTS - 1)), draft]);
    toast.success("Снимок сохранён");
  }, [draft]);

  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = draft.slice(start, end);
      const newText = draft.slice(0, start) + before + sel + after + draft.slice(end);
      handleDraftChange(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + before.length, end + before.length);
      }, 0);
    },
    [draft, handleDraftChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        } else if (e.key === "y") {
          e.preventDefault();
          handleRedo();
        } else if (e.key === "b") {
          e.preventDefault();
          wrapSelection("**", "**");
        } else if (e.key === "i") {
          e.preventDefault();
          wrapSelection("*", "*");
        }
      }
    },
    [handleUndo, handleRedo, wrapSelection]
  );

  const handleStartEdit = () => {
    setDraft(value);
    setUndoStack([]);
    setRedoStack([]);
    setEditing(true);
    setShowPreview(false);
  };

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
    toast.success("Изменения сохранены");
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
    setSnapshots([]);
  };

  const restoreSnapshot = (snap: string) => {
    handleDraftChange(snap);
    toast.success("Версия восстановлена");
  };

  if (editing) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {markdownPreview && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                showPreview
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Предпросмотр
            </button>
          )}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Отменить (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Отменить
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Повторить (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            Повторить
          </button>
          <button
            type="button"
            onClick={handleSnapshot}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
            title="Сохранить снимок"
          >
            <FileStack className="w-3.5 h-3.5" />
            Снимок
          </button>
          {snapshots.length > 0 && (
            <div className="flex items-center gap-1">
              {snapshots.map((snap, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => restoreSnapshot(snap)}
                  className="px-2 py-1 rounded text-[10px] font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  title={`Версия ${i + 1}`}
                >
                  {`v${i + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
        {showPreview ? (
          <LazyMarkdownPreview
            markdown={draft || placeholder}
            className="min-h-[120px] px-4 py-3 rounded-xl border border-border bg-muted/30 prose prose-sm dark:prose-invert max-w-none"
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-y transition-colors"
            autoFocus
          />
        )}
        <p className="text-[10px] text-muted-foreground">
          Ctrl+Z Отменить · Ctrl+Y Повторить · Ctrl+B жирный · Ctrl+I курсив
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="gap-1.5 rounded-full">
            <Check className="w-3.5 h-3.5" />
            Сохранить
          </Button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-0 min-w-0 ${className}`}>
      <div className="sticky top-0 z-20 -mx-1 mb-3 flex justify-end border-b border-border/50 bg-background/90 px-1 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <button
          type="button"
          onClick={handleStartEdit}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-transparent bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground/90 shadow-sm ring-1 ring-border/40 hover:border-primary/25 hover:bg-primary/10 hover:text-foreground"
          title="Редактировать"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Редактировать</span>
        </button>
      </div>
      <div className="min-w-0">{renderView(value)}</div>
    </div>
  );
}

const FlashcardItem = memo(function FlashcardItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group cursor-pointer"
      onClick={() => setFlipped(!flipped)}
    >
      <div className="rounded-xl border border-border bg-muted/30 p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/50 active:scale-[0.995] cursor-pointer">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">В: {question}</p>
            <motion.div
              initial={false}
              animate={{
                height: flipped ? "auto" : 0,
                opacity: flipped ? 1 : 0,
              }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-border mt-2">
                <p className="text-sm text-muted-foreground">О: {answer}</p>
              </div>
            </motion.div>
            {!flipped && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Нажмите, чтобы показать ответ
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export function OutputPanel({
  onReExtract,
  onCancel,
  onRetryExtract,
}: {
  onReExtract?: (content: string, preset: string, sourceLabel: string) => Promise<void>;
  onCancel?: () => void;
  /** Повторить основное извлечение после ошибки AI */
  onRetryExtract?: () => void;
}) {
  const [reExtractOpen, setReExtractOpen] = useState(false);
  const [expandLoading, setExpandLoading] = useState<number | null>(null);
  const [expandedIdea, setExpandedIdea] = useState<{ index: number; text: string } | null>(null);
  /** Полный текст углубления (false = свёрнут превью) */
  const [deepDiveTextExpanded, setDeepDiveTextExpanded] = useState(true);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareNoteA, setCompareNoteA] = useState<string | null>(null);
  const [compareNoteB, setCompareNoteB] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const {
    currentResult,
    savedPage,
    setSavedPage,
    history,
    activeOutputTab,
    setActiveOutputTab,
    status,
    updateCurrentResult,
    streamingChars,
    settings,
    errorMessage,
  } = useAppStore(
    useShallow((s) => ({
      currentResult: s.currentResult,
      savedPage: s.savedPage,
      setSavedPage: s.setSavedPage,
      history: s.history,
      activeOutputTab: s.activeOutputTab,
      setActiveOutputTab: s.setActiveOutputTab,
      status: s.status,
      updateCurrentResult: s.updateCurrentResult,
      streamingChars: s.streamingChars,
      settings: s.settings,
      errorMessage: s.errorMessage,
    }))
  );

  const buildReExtractContent = () => {
    if (!currentResult) return "";
    const parts: string[] = [];
    if (currentResult.summary) parts.push(`# Резюме\n\n${currentResult.summary}`);
    if (currentResult.keyIdeas?.length) {
      parts.push(`# Ключевые идеи\n\n${currentResult.keyIdeas.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`);
    }
    if (currentResult.structuredNotes) parts.push(`# Заметки\n\n${currentResult.structuredNotes}`);
    const links = currentResult.extractedLinks ?? [];
    if (links.length) {
      parts.push(
        `# Ссылки со страницы\n\n${links
          .map((l) => {
            const desc = l.description?.trim() ? ` — ${l.description.trim()}` : "";
            return `- ${l.label}${desc}\n  ${l.href}`;
          })
          .join("\n")}`
      );
    }
    const codes = currentResult.codeSnippets ?? [];
    if (codes.length) {
      parts.push(
        `# Код и пояснения\n\n${codes
          .map(
            (s, i) =>
              `## ${i + 1}. ${s.title}${s.language ? ` (${s.language})` : ""}\n\`\`\`${s.language ?? ""}\n${s.code}\n\`\`\`\n\n${s.explanation}`
          )
          .join("\n\n")}`
      );
    }
    return parts.join("\n\n---\n\n") || currentResult.summary || "";
  };

  useEffect(() => {
    if (expandedIdea) setDeepDiveTextExpanded(true);
  }, [expandedIdea?.index, expandedIdea?.text]);

  const handleExpandIdea = async (index: number, idea: string) => {
    if (!currentResult) return;
    setExpandLoading(index);
    setExpandedIdea(null);
    try {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "expand",
          idea,
          context: {
            title: currentResult.title,
            summary: currentResult.summary,
            keyIdeas: currentResult.keyIdeas,
            structuredNotes: currentResult.structuredNotes,
          },
          provider: settings.provider,
          groqApiKey: settings.provider === "groq" ? settings.groqApiKey : undefined,
          groqModel: settings.provider === "groq" ? settings.groqModel : undefined,
          geminiApiKey: settings.provider === "gemini" ? settings.geminiApiKey : undefined,
          geminiModel: settings.provider === "gemini" ? settings.geminiModel : undefined,
          ollamaUrl: settings.provider === "ollama" ? settings.ollamaUrl : undefined,
          ollamaModel: settings.provider === "ollama" ? settings.ollamaModel : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setExpandedIdea({ index, text: data.text });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось углубиться");
    } finally {
      setExpandLoading(null);
    }
  };

  const handleCompare = async () => {
    const a = history.find((h) => h.id === compareNoteA);
    const b = history.find((h) => h.id === compareNoteB);
    if (!a || !b || a.id === b.id) {
      toast.error("Выберите две разные заметки");
      return;
    }
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "compare",
          noteA: a,
          noteB: b,
          provider: settings.provider,
          groqApiKey: settings.provider === "groq" ? settings.groqApiKey : undefined,
          groqModel: settings.provider === "groq" ? settings.groqModel : undefined,
          geminiApiKey: settings.provider === "gemini" ? settings.geminiApiKey : undefined,
          geminiModel: settings.provider === "gemini" ? settings.geminiModel : undefined,
          ollamaUrl: settings.provider === "ollama" ? settings.ollamaUrl : undefined,
          ollamaModel: settings.provider === "ollama" ? settings.ollamaModel : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setCompareResult(data.text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сравнить");
    } finally {
      setCompareLoading(false);
    }
  };

  useEffect(() => {
    setChatMessages([]);
  }, [currentResult?.id]);

  const handleChatSend = async () => {
    const q = chatInput.trim();
    if (!q || !currentResult || chatLoading) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: q }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "question",
          question: q,
          context: currentResult,
          history: chatMessages,
          provider: settings.provider,
          groqApiKey: settings.provider === "groq" ? settings.groqApiKey : undefined,
          groqModel: settings.provider === "groq" ? settings.groqModel : undefined,
          geminiApiKey: settings.provider === "gemini" ? settings.geminiApiKey : undefined,
          geminiModel: settings.provider === "gemini" ? settings.geminiModel : undefined,
          ollamaUrl: settings.provider === "ollama" ? settings.ollamaUrl : undefined,
          ollamaModel: settings.provider === "ollama" ? settings.ollamaModel : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось получить ответ");
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  if (status === "error" && !currentResult && !savedPage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-4"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Не удалось извлечь</h3>
            <p className="text-sm text-muted-foreground leading-relaxed break-words">
              {errorMessage || "Проверьте источник, ключ API или попробуйте снова."}
            </p>
          </div>
          {onRetryExtract ? (
            <Button type="button" className="w-full sm:w-auto" onClick={() => onRetryExtract()}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Повторить
            </Button>
          ) : null}
        </motion.div>
      </div>
    );
  }

  if (!currentResult && !savedPage && status !== "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm"
        >
          <EmptyStateIllustration variant="output" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Пока нет извлечений
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Вставьте URL, загрузите PDF или введите текст — Sensify извлечёт
            структурированные знания
          </p>
          <ul className="text-left text-xs text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
              Вставьте ссылку на статью или YouTube
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
              Загрузите PDF или вставьте текст
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
              Нажмите «Извлечь смысл» или Ctrl+Enter
            </li>
          </ul>
        </motion.div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="h-1 overflow-hidden rounded-full bg-muted/50 mb-2">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{
                  width: ["0%", "70%", "90%", "70%"],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            {streamingChars > 0 && (
              <p className="text-xs text-muted-foreground">
                Генерирую... ({streamingChars} символов)
              </p>
            )}
          </div>
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} className="shrink-0">
              Отмена
            </Button>
          )}
        </div>
        <ExtractionSkeleton />
      </div>
    );
  }

  if (savedPage) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold line-clamp-1">{savedPage.title}</h2>
            <a
              href={savedPage.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary truncate block mt-0.5"
            >
              {savedPage.source}
            </a>
          </div>
          <button
            type="button"
            onClick={() => setSavedPage(null)}
            className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <article className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{savedPage.content}</ReactMarkdown>
          </article>
        </div>
      </div>
    );
  }

  if (!currentResult) return null;

  const getSectionText = () => {
    const ideas = currentResult.keyIdeas ?? [];
    const cards = currentResult.flashcards ?? [];
    switch (activeOutputTab) {
      case "summary":
        return currentResult.summary ?? "";
      case "ideas":
        return ideas.map((idea, i) => `${i + 1}. ${idea}`).join("\n");
      case "flashcards":
        return cards
          .map((fc) => `В: ${fc?.question ?? ""}\nО: ${fc?.answer ?? ""}`)
          .join("\n\n");
      case "notes":
        return currentResult.structuredNotes ?? "";
      case "code": {
        const list = currentResult.codeSnippets ?? [];
        if (!list.length) return "";
        return list
          .map(
            (s, i) =>
              `## ${i + 1}. ${s.title}${s.language ? ` (${s.language})` : ""}\n\`\`\`${s.language ?? ""}\n${s.code}\n\`\`\`\n\n${s.explanation}`
          )
          .join("\n\n---\n\n");
      }
      case "links": {
        const list = currentResult.extractedLinks ?? [];
        if (!list.length) return "";
        return list
          .map((l) => {
            const desc = l.description?.trim() ? `\n  ${l.description.trim()}` : "";
            return `- [${l.label}](${l.href})${desc}`;
          })
          .join("\n");
      }
      default:
        return "";
    }
  };

  const faviconUrl = getFaviconUrl(currentResult.source, currentResult.sourceType);

  return (
    <div className="flex flex-col h-full">
      {status === "error" && errorMessage ? (
        <div
          className="mb-3 flex flex-col gap-2 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="flex min-w-0 items-start gap-2 text-left">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-destructive">Ошибка при последнем извлечении</p>
              <p className="text-[11px] text-muted-foreground leading-snug break-words mt-0.5">{errorMessage}</p>
            </div>
          </div>
          {onRetryExtract ? (
            <Button type="button" size="sm" variant="outline" className="shrink-0 border-destructive/40" onClick={() => onRetryExtract()}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Повторить
            </Button>
          ) : null}
        </div>
      ) : null}
      {currentResult.imageUrl && (
        <ImagePreview url={currentResult.imageUrl} />
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <SourceFavicon
            faviconUrl={faviconUrl}
            sourceType={currentResult.sourceType}
          />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold line-clamp-1">
              {currentResult.title}
            </h2>
            {currentResult.source && (
              <p className="text-xs text-muted-foreground truncate mt-0.5" title={currentResult.source}>
                {currentResult.source}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {(currentResult.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))}
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={activeOutputTab}
        onValueChange={setActiveOutputTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-0.5 sm:pb-0 sm:max-w-[min(100%,52rem)] [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1">
            <TabsList className="inline-flex h-auto min-h-9 w-max max-w-full flex-wrap justify-start gap-0.5 p-1">
            {outputTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 text-xs sm:px-3"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          </div>
          <div className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-start gap-1 sm:ml-auto sm:w-auto sm:max-w-[min(100%,42rem)] sm:justify-end sm:pt-0.5">
            {onReExtract && buildReExtractContent().length > 100 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setReExtractOpen(!reExtractOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all"
                  title="Извлечь заново с другим пресетом"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Заново</span>
                </button>
                {reExtractOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setReExtractOpen(false)} aria-hidden />
                    <div className="absolute right-0 top-full mt-1 z-50 py-1 rounded-xl border border-border bg-card shadow-lg min-w-[180px]">
                      {presetOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setReExtractOpen(false);
                            onReExtract(buildReExtractContent(), opt.value, `Повторное извлечение: ${currentResult.title}`);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {history.length >= 2 && (
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all"
                title="Сравнить две заметки"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Сравнить</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setChatOpen(!chatOpen)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                chatOpen
                  ? "text-primary bg-primary/10 border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/10 border border-transparent hover:border-primary/20"
              )}
              title="Задать вопрос по материалу"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Вопросы</span>
            </button>
            <ShareButton result={currentResult} />
            <CopyButton text={getSectionText()} />
          </div>
        </div>

        <div className="flex-1 overflow-auto mt-1">
          <TabsContent value="summary">
            <EditableBlock
              value={currentResult.summary}
              onSave={(v) => updateCurrentResult({ summary: v })}
              markdownPreview
              renderView={(v) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h2:text-base prose-h2:font-semibold prose-h2:mt-4 prose-h2:mb-2 prose-h3:text-sm prose-h3:font-medium prose-h3:mt-3 prose-h3:mb-1.5 prose-p:leading-relaxed prose-p:text-foreground/90 prose-li:my-0.5"
                >
                  <ReactMarkdown>{v || ""}</ReactMarkdown>
                </motion.div>
              )}
              placeholder={"## Суть\n\nКратко о чём материал.\n\n## Ключевые моменты\n\n- пункт 1\n- пункт 2\n\n## Выводы\n\nИтог в 1–2 абзацах."}
            />
          </TabsContent>

          <TabsContent value="ideas">
            <EditableBlock
              value={(currentResult.keyIdeas ?? []).map((i, idx) => `${idx + 1}. ${i}`).join("\n")}
              onSave={(v) => {
                const ideas = v
                  .split("\n")
                  .map((line) => line.replace(/^\d+\.\s*/, "").trim())
                  .filter(Boolean);
                updateCurrentResult({ keyIdeas: ideas });
              }}
              renderView={(v) => (
                <div className="space-y-3">
                  {v.split("\n").filter(Boolean).map((line, i) => {
                    const idea = line.replace(/^\d+\.\s*/, "");
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex gap-3 items-start">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed text-foreground/90">
                              {idea}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleExpandIdea(i, idea)}
                              disabled={expandLoading !== null}
                              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                            >
                              {expandLoading === i ? (
                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                              Углубиться
                            </button>
                          </div>
                        </div>
                        {expandedIdea?.index === i && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="ml-9 space-y-2 pl-4 border-l-2 border-primary/20"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Углубление
                              </span>
                              <div className="flex flex-wrap items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setDeepDiveTextExpanded((v) => !v)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                                >
                                  {deepDiveTextExpanded ? (
                                    <>
                                      <ChevronUp className="h-3.5 w-3.5" />
                                      Свернуть текст
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3.5 w-3.5" />
                                      Показать полностью
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setExpandedIdea(null)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                  Закрыть
                                </button>
                              </div>
                            </div>
                            <div
                              className={cn(
                                "rounded-lg bg-muted/20 px-3 py-2",
                                !deepDiveTextExpanded &&
                                  "relative overflow-hidden after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-12 after:bg-gradient-to-t after:from-muted/30 after:to-transparent"
                              )}
                            >
                              <p
                                className={cn(
                                  "text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap",
                                  !deepDiveTextExpanded && "line-clamp-6"
                                )}
                              >
                                {expandedIdea.text}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
              placeholder={'1. Идея первая\n2. Идея вторая\n...'}
            />
          </TabsContent>

          <TabsContent value="flashcards">
            <EditableBlock
              value={(currentResult.flashcards ?? [])
                .map((fc) => `В: ${fc?.question ?? ""}\nО: ${fc?.answer ?? ""}`)
                .join("\n\n")}
              onSave={(v) => {
                const blocks = v.split(/\n\n+/).filter(Boolean);
                const cards = blocks.map((block) => {
                  const lines = block.split("\n");
                  let q = "",
                    a = "";
                  for (const line of lines) {
                    if (line.startsWith("В:")) q = line.slice(2).trim();
                    else if (line.startsWith("О:")) a = line.slice(2).trim();
                  }
                  return { question: q, answer: a };
                });
                updateCurrentResult({ flashcards: cards });
              }}
              renderView={(v) => {
                const blocks = v.split(/\n\n+/).filter(Boolean);
                const cards = blocks.map((block) => {
                  const lines = block.split("\n");
                  let q = "",
                    a = "";
                  for (const line of lines) {
                    if (line.startsWith("В:")) q = line.slice(2).trim();
                    else if (line.startsWith("О:")) a = line.slice(2).trim();
                  }
                  return { question: q, answer: a };
                });
                return (
                  <div className="space-y-2">
                    {cards.map((fc, i) => (
                      <FlashcardItem
                        key={i}
                        question={fc.question}
                        answer={fc.answer}
                        index={i}
                      />
                    ))}
                  </div>
                );
              }}
              placeholder={'В: Вопрос\nО: Ответ\n\nВ: Вопрос 2\nО: Ответ 2'}
            />
          </TabsContent>

          <TabsContent value="notes">
            <EditableBlock
              value={currentResult.structuredNotes}
              onSave={(v) => updateCurrentResult({ structuredNotes: v })}
              markdownPreview
              renderView={(v) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-sm dark:prose-invert max-w-none"
                >
                  <ReactMarkdown>{v}</ReactMarkdown>
                </motion.div>
              )}
              placeholder="Заметки в Markdown..."
            />
          </TabsContent>

          <TabsContent value="code">
            {(() => {
              const snippets = currentResult.codeSnippets ?? [];
              if (!snippets.length) {
                return (
                  <p className="text-sm text-muted-foreground">
                    Фрагменты кода не найдены в ответе модели. Они появляются, когда в источнике есть блоки кода
                    (страница, README, Markdown) и модель заполнила поле codeSnippets.
                  </p>
                );
              }
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5 pr-1"
                >
                  <p className="text-xs text-muted-foreground">
                    Код из материала с пояснениями: что делает, как устроен, зачем и почему так. Редактирование — через
                    повторное извлечение или правку заметок.
                  </p>
                  {snippets.map((s, i) => (
                    <div
                      key={`${s.title}-${i}`}
                      className="overflow-hidden rounded-xl border border-border/60 bg-muted/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/25 px-3 py-2">
                        <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                        {s.language ? (
                          <span className="rounded-md bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground ring-1 ring-border/50">
                            {s.language}
                          </span>
                        ) : null}
                      </div>
                      <pre className="max-h-80 overflow-auto m-0 border-b border-border/40 bg-muted/35 p-3 font-mono text-[11px] leading-relaxed text-foreground/95">
                        {s.code || "// (пусто)"}
                      </pre>
                      <div className="p-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {s.explanation || (
                          <span className="text-muted-foreground italic">Пояснение не указано.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              );
            })()}
          </TabsContent>

          <TabsContent value="links">
            {(() => {
              const links = currentResult.extractedLinks ?? [];
              if (!links.length) {
                return (
                  <p className="text-sm text-muted-foreground">
                    Ссылки не найдены: для этого источника нет HTML (например, только текст/API) или на странице не было
                    подходящих ссылок.
                  </p>
                );
              }
              const grouped = groupExtractedLinksByHost(links);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pr-1"
                >
                  <p className="text-xs text-muted-foreground">
                    По хостам: {grouped.length} групп, всего {links.length} ссылок. Подпись и контекст — из текста
                    страницы или атрибута title. Полный URL можно раскрыть или скопировать.
                  </p>
                  {grouped.map(([host, items]) => (
                    <div key={host}>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        {host}
                        <span className="ml-2 font-normal normal-case text-muted-foreground/70">({items.length})</span>
                      </h3>
                      <ul className="space-y-2 list-none m-0 p-0">
                        {items.map((l, i) => (
                          <li
                            key={`${l.href}-${i}`}
                            className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                          >
                            <a
                              href={l.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-start gap-2 text-sm font-medium text-primary hover:underline break-words"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                              <span className="min-w-0">{l.label || shortDisplayUrl(l.href)}</span>
                            </a>
                            {l.description?.trim() ? (
                              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{l.description.trim()}</p>
                            ) : null}
                            <details className="mt-2">
                              <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden flex items-center gap-1.5">
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                <span className="font-mono truncate" title={l.href}>
                                  {shortDisplayUrl(l.href)}
                                </span>
                                <span className="text-[10px] text-muted-foreground/80 shrink-0">· полный адрес</span>
                              </summary>
                              <div className="mt-2 space-y-2 border-l-2 border-primary/20 pl-3">
                                <p className="break-all font-mono text-[11px] leading-snug text-muted-foreground">
                                  {l.href}
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={async () => {
                                    await copyToClipboard(l.href);
                                    toast.success("URL скопирован");
                                  }}
                                >
                                  <Copy className="mr-1 h-3 w-3" />
                                  Скопировать URL
                                </Button>
                              </div>
                            </details>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </motion.div>
              );
            })()}
          </TabsContent>
        </div>

        {chatOpen && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Вопросы по материалу</h4>
            <div className="space-y-3 max-h-64 overflow-auto">
              {chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground/70">Задайте вопрос — AI ответит на основе заметки.</p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-sm rounded-lg px-3 py-2",
                    msg.role === "user"
                      ? "bg-primary/10 text-foreground ml-4"
                      : "bg-muted/50 text-muted-foreground mr-4"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="text-sm rounded-lg px-3 py-2 bg-muted/50 text-muted-foreground mr-4">
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  {" "}Думаю...
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChatSend()}
                placeholder="Вопрос по материалу..."
                className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={chatLoading}
              />
              <Button size="sm" onClick={handleChatSend} disabled={!chatInput.trim() || chatLoading}>
                Отправить
              </Button>
            </div>
          </div>
        )}

        {compareOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setCompareOpen(false)} aria-hidden />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  Сравнение заметок
                </h3>
                <button onClick={() => setCompareOpen(false)} className="cursor-pointer">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Заметка A</label>
                  <select
                    value={compareNoteA ?? ""}
                    onChange={(e) => setCompareNoteA(e.target.value || null)}
                    className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
                  >
                    <option value="">Выберите...</option>
                    {history.map((h) => (
                      <option key={h.id} value={h.id}>
                        {truncate(h.title, 50)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Заметка B</label>
                  <select
                    value={compareNoteB ?? ""}
                    onChange={(e) => setCompareNoteB(e.target.value || null)}
                    className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
                  >
                    <option value="">Выберите...</option>
                    {history.map((h) => (
                      <option key={h.id} value={h.id}>
                        {truncate(h.title, 50)}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleCompare}
                  disabled={!compareNoteA || !compareNoteB || compareNoteA === compareNoteB || compareLoading}
                  className="w-full gap-2"
                >
                  {compareLoading && (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  Сравнить
                </Button>
                {compareResult && (
                  <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border max-h-64 overflow-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{compareResult}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Tabs>
    </div>
  );
}
