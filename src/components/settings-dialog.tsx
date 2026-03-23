"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import {
  Cloud,
  Server,
  Gauge,
  Languages,
  Palette,
  Moon,
  Sun,
  ExternalLink,
  Monitor,
  Webhook,
  CheckCircle2,
  Loader2,
  FileText,
  Zap,
  Download,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import type { AIProvider, ExtractionQuality, ExtractionPreset } from "@/types";

const presetOptions: { value: ExtractionPreset; label: string }[] = [
  { value: "default", label: "По умолчанию" },
  { value: "technical_docs", label: "Документация" },
  { value: "discussion", label: "Обсуждение / тред" },
  { value: "tech_notes", label: "Технические заметки" },
  { value: "actions", label: "Задачи (action items)" },
  { value: "research", label: "Исследование / RFC" },
  { value: "release_notes", label: "Релиз / changelog" },
];

const qualityOptions: {
  value: ExtractionQuality;
  label: string;
  description: string;
}[] = [
  { value: "fast", label: "Быстрый", description: "Быстрый анализ, меньше деталей" },
  { value: "balanced", label: "Баланс", description: "Хорошее качество и скорость" },
  { value: "deep", label: "Глубокий", description: "Тщательный анализ, больше времени" },
];

const languages = [
  { value: "auto", label: "Автоопределение" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
];

const groqModels = [
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B", desc: "Быстрый" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", desc: "Мощный" },
  { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B", desc: "Мощный" },
  { value: "gemma2-9b-it", label: "Gemma 2 9B", desc: "Сбалансированный" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B", desc: "Длинный контекст" },
];

const geminiModels = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", desc: "Быстрый" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Оптимальный" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Мощный" },
];

const ollamaModels = [
  "llama3.1",
  "llama3.1:70b",
  "llama3.2",
  "mistral",
  "mixtral",
  "gemma2",
  "qwen2.5",
  "phi3",
  "deepseek-r1",
  "command-r",
];

function VerifyGeminiButton({ apiKey }: { apiKey: string }) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  const handleVerify = async () => {
    if (!apiKey?.trim()) {
      toast.error("Введите API-ключ");
      return;
    }
    setLoading(true);
    setOk(null);
    try {
      const res = await fetch("/api/verify-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setOk(true);
        toast.success("Подключение успешно");
      } else {
        setOk(false);
        toast.error(data.error || "Ошибка проверки");
      }
    } catch {
      setOk(false);
      toast.error("Не удалось проверить подключение");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 shrink-0"
          onClick={handleVerify}
          disabled={loading || !apiKey?.trim()}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : ok === true ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            "Проверить"
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Проверить API-ключ</TooltipContent>
    </Tooltip>
  );
}

function VerifyGroqButton({ apiKey }: { apiKey: string }) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  const handleVerify = async () => {
    if (!apiKey?.trim()) {
      toast.error("Введите API-ключ");
      return;
    }
    setLoading(true);
    setOk(null);
    try {
      const res = await fetch("/api/verify-groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (data.success) {
        setOk(true);
        toast.success("Подключение успешно");
      } else {
        setOk(false);
        toast.error(data.error || "Ошибка проверки");
      }
    } catch {
      setOk(false);
      toast.error("Не удалось проверить подключение");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 shrink-0"
          onClick={handleVerify}
          disabled={loading || !apiKey?.trim()}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : ok === true ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            "Проверить"
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Проверить API-ключ</TooltipContent>
    </Tooltip>
  );
}

function LoadFromAccountButton({ onLoad }: { onLoad: (key: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/groq-key");
      const data = (await res.json()) as { groqApiKey?: string | null };
      if (data.groqApiKey && typeof data.groqApiKey === "string") {
        onLoad(data.groqApiKey);
        toast.success("Ключ загружен из аккаунта");
      } else {
        toast.error("Ключ не сохранён в аккаунте. Введите и сохраните его.");
      }
    } catch {
      toast.error("Не удалось загрузить ключ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 shrink-0"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Из аккаунта
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Вставить ключ из аккаунта (на случай если не подгрузился)</TooltipContent>
    </Tooltip>
  );
}

function SaveGroqKeyButton({ apiKey, onSave }: { apiKey: string; onSave: () => void | Promise<void> }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey?.trim()) {
      toast.error("Введите API-ключ");
      return;
    }
    setLoading(true);
    try {
      await onSave();
      setSaved(true);
      toast.success("API-ключ сохранён");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-9 px-3 shrink-0"
          onClick={handleSave}
          disabled={!apiKey?.trim() || loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            "Сохранить"
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Сохранить ключ (в аккаунт или локально)</TooltipContent>
    </Tooltip>
  );
}

function SaveGeminiKeyButton({ apiKey, onSave }: { apiKey: string; onSave: () => void | Promise<void> }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey?.trim()) {
      toast.error("Введите API-ключ");
      return;
    }
    setLoading(true);
    try {
      await onSave();
      setSaved(true);
      toast.success("API-ключ Gemini сохранён");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-9 px-3 shrink-0"
          onClick={handleSave}
          disabled={!apiKey?.trim() || loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            "Сохранить"
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Сохранить ключ Gemini (в аккаунт или локально)</TooltipContent>
    </Tooltip>
  );
}

function LoadFromAccountGeminiButton({ onLoad }: { onLoad: (key: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/gemini-key");
      const data = (await res.json()) as { geminiApiKey?: string | null };
      if (data.geminiApiKey && typeof data.geminiApiKey === "string") {
        onLoad(data.geminiApiKey);
        toast.success("Ключ Gemini загружен из аккаунта");
      } else {
        toast.error("Ключ Gemini не сохранён в аккаунте. Введите и сохраните его.");
      }
    } catch {
      toast.error("Не удалось загрузить ключ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 shrink-0"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Из аккаунта
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Вставить ключ Gemini из аккаунта</TooltipContent>
    </Tooltip>
  );
}

function VerifyOllamaButton({ url }: { url: string }) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  const handleVerify = async () => {
    const u = url?.trim() || "http://localhost:11434";
    setLoading(true);
    setOk(null);
    try {
      const res = await fetch("/api/verify-ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ollamaUrl: u }),
      });
      const data = (await res.json()) as { success?: boolean; version?: string; error?: string };
      if (data.success) {
        setOk(true);
        toast.success(`Ollama ${data.version ?? ""} подключена`);
      } else {
        setOk(false);
        toast.error(data.error || "Ошибка проверки");
      }
    } catch {
      setOk(false);
      toast.error("Не удалось подключиться к Ollama");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 shrink-0"
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : ok === true ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            "Проверить"
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Проверить подключение к Ollama</TooltipContent>
    </Tooltip>
  );
}

export function SettingsDialog() {
  const { data: session } = useSession();
  const { settingsOpen, setSettingsOpen, settings, updateSettings } =
    useAppStore(
      useShallow((s) => ({
        settingsOpen: s.settingsOpen,
        setSettingsOpen: s.setSettingsOpen,
        settings: s.settings,
        updateSettings: s.updateSettings,
      }))
    );

  const [hasStoredGroqKey, setHasStoredGroqKey] = useState(false);
  const [hasStoredGeminiKey, setHasStoredGeminiKey] = useState(false);

  // Загрузка ключа из аккаунта при открытии настроек (для авторизованных)
  useEffect(() => {
    if (!settingsOpen || !session?.user) return;
    Promise.all([
      fetch("/api/user/groq-key").then((r) => r.json()),
      fetch("/api/user/gemini-key").then((r) => r.json()),
    ]).then(([groqData, geminiData]) => {
      if (groqData.groqApiKey && typeof groqData.groqApiKey === "string") {
        updateSettings({ groqApiKey: groqData.groqApiKey });
        setHasStoredGroqKey(true);
      } else setHasStoredGroqKey(false);
      if (geminiData.geminiApiKey && typeof geminiData.geminiApiKey === "string") {
        updateSettings({ geminiApiKey: geminiData.geminiApiKey });
        setHasStoredGeminiKey(true);
      } else setHasStoredGeminiKey(false);
    }).catch(() => {
      setHasStoredGroqKey(false);
      setHasStoredGeminiKey(false);
    });
  }, [settingsOpen, session?.user, updateSettings]);

  const handleSaveGroqKey = async () => {
    const key = settings.groqApiKey;
    updateSettings({ groqApiKey: key });
    if (session?.user) {
      const res = await fetch("/api/user/groq-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groqApiKey: key }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Ошибка сохранения");
      }
      setHasStoredGroqKey(true);
    }
  };

  const handleSaveGeminiKey = async () => {
    const key = settings.geminiApiKey;
    updateSettings({ geminiApiKey: key });
    if (session?.user) {
      const res = await fetch("/api/user/gemini-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: key }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Ошибка сохранения");
      }
      setHasStoredGeminiKey(true);
    }
  };

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
          <DialogDescription>
            AI-провайдер, тема и параметры учётной записи.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ai" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="ai" className="gap-1.5 text-xs">
              <Cloud className="w-3.5 h-3.5" />
              AI
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-1.5 text-xs">
              <Palette className="w-3.5 h-3.5" />
              Тема
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-1.5 text-xs">
              <Webhook className="w-3.5 h-3.5" />
              Учётная запись
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6 mt-0">
        <div className="space-y-6">
          {/* --- Выбор провайдера --- */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">AI-провайдер</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => updateSettings({ provider: "groq" })}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  settings.provider === "groq"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    settings.provider === "groq"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Groq Cloud</p>
                  <p className="text-[10px] text-muted-foreground">
                    Бесплатно, быстро, без установки
                  </p>
                </div>
              </button>
              <button
                onClick={() => updateSettings({ provider: "ollama" })}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  settings.provider === "ollama"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    settings.provider === "ollama"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Ollama</p>
                  <p className="text-[10px] text-muted-foreground">
                    Локально, нужна установка
                  </p>
                </div>
              </button>
              <button
                onClick={() => updateSettings({ provider: "gemini" })}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  settings.provider === "gemini"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    settings.provider === "gemini"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Google Gemini</p>
                  <p className="text-[10px] text-muted-foreground">
                    Бесплатно, качество
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* --- Настройки Gemini --- */}
          {settings.provider === "gemini" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Google Gemini</h4>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gemini — бесплатный AI от Google. Щедрый лимит, хорошее качество извлечения.
                </p>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  Получить бесплатный API-ключ
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  API-ключ Gemini
                </label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="password"
                    placeholder="AIza..."
                    value={settings.geminiApiKey}
                    onChange={(e) =>
                      updateSettings({ geminiApiKey: e.target.value })
                    }
                    className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                  <VerifyGeminiButton apiKey={settings.geminiApiKey} />
                  <SaveGeminiKeyButton
                    apiKey={settings.geminiApiKey}
                    onSave={handleSaveGeminiKey}
                  />
                  {session?.user && hasStoredGeminiKey && (
                    <LoadFromAccountGeminiButton
                      onLoad={(key) => updateSettings({ geminiApiKey: key })}
                    />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {session?.user
                    ? "Ключ привязан к аккаунту и доступен на всех устройствах."
                    : "Ключ хранится локально (в браузере)."}
                </p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Модель
                </label>
                <div className="space-y-1.5">
                  {geminiModels.map((model) => (
                    <button
                      key={model.value}
                      onClick={() =>
                        updateSettings({ geminiModel: model.value })
                      }
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                        settings.geminiModel === model.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            settings.geminiModel === model.value
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          )}
                        />
                        <span className="text-xs font-medium">
                          {model.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {model.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- Настройки Groq --- */}
          {settings.provider === "groq" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Groq Cloud</h4>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Groq — бесплатный облачный AI с молниеносной скоростью.
                  Использует те же open-source модели (Llama, Gemma, Mixtral),
                  но не требует ничего устанавливать.
                </p>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  Получить бесплатный API-ключ
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  API-ключ Groq
                </label>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={settings.groqApiKey}
                    onChange={(e) =>
                      updateSettings({ groqApiKey: e.target.value })
                    }
                    className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                  <VerifyGroqButton apiKey={settings.groqApiKey} />
                  <SaveGroqKeyButton
                    apiKey={settings.groqApiKey}
                    onSave={handleSaveGroqKey}
                  />
                  {session?.user && hasStoredGroqKey && (
                    <LoadFromAccountButton
                      onLoad={(key) => updateSettings({ groqApiKey: key })}
                    />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {session?.user
                    ? "Введите ключ → Проверьте → Сохраните. Ключ привязан к аккаунту и доступен на всех устройствах."
                    : "Введите ключ → Проверьте → Сохраните. Ключ хранится локально (в браузере)."}
                </p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Модель
                </label>
                <div className="space-y-1.5">
                  {groqModels.map((model) => (
                    <button
                      key={model.value}
                      onClick={() =>
                        updateSettings({ groqModel: model.value })
                      }
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                        settings.groqModel === model.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            settings.groqModel === model.value
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          )}
                        />
                        <span className="text-xs font-medium">
                          {model.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {model.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- Настройки Ollama --- */}
          {settings.provider === "ollama" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Ollama (локально)</h4>
              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Требует установки Ollama на компьютер.
                  Скачайте с{" "}
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    ollama.com
                  </a>
                  , затем выполните{" "}
                  <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                    ollama pull llama3.1
                  </code>
                </p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Адрес сервера
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="http://localhost:11434"
                    value={settings.ollamaUrl}
                    onChange={(e) =>
                      updateSettings({ ollamaUrl: e.target.value })
                    }
                    className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                  <VerifyOllamaButton url={settings.ollamaUrl} />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Модель
                </label>
                <input
                  type="text"
                  placeholder="llama3.1"
                  value={settings.ollamaModel}
                  onChange={(e) =>
                    updateSettings({ ollamaModel: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ollamaModels.map((model) => (
                    <button
                      key={model}
                      onClick={() =>
                        updateSettings({ ollamaModel: model })
                      }
                      className={cn(
                        "text-[10px] px-2.5 py-1.5 rounded-md border transition-all cursor-pointer shrink-0",
                        settings.ollamaModel === model
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- Пресет извлечения --- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Пресет извлечения</h4>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Настрой фокус: конспект, идеи для статьи или action items.
            </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presetOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ extractionPreset: opt.value })}
                    className={cn(
                      "p-2.5 rounded-lg border text-left transition-all cursor-pointer",
                      settings.extractionPreset === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Дополнительные инструкции (опционально)
              </label>
              <textarea
                placeholder="Например: акцент на практические примеры, избегай жаргона..."
                value={settings.customPrompt ?? ""}
                onChange={(e) =>
                  updateSettings({ customPrompt: e.target.value })
                }
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
              />
            </div>
          </div>

          {/* --- Стриминг --- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Стриминг ответа</h4>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Текст появляется по мере генерации — быстрее отклик, виден прогресс.
            </p>
            <button
              onClick={() => updateSettings({ streaming: !(settings.streaming ?? true) })}
              className={cn(
                "w-full flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer",
                (settings.streaming ?? true)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <span className="text-xs font-medium">
                {(settings.streaming ?? true) ? "Включён" : "Выключен"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {(settings.streaming ?? true) ? "Рекомендуется" : "Ждать до конца"}
              </span>
            </button>
          </div>

          {/* --- Качество --- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Качество извлечения</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {qualityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ quality: opt.value })}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                    settings.quality === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* --- Язык --- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Язык контента</h4>
            </div>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="theme" className="space-y-6 mt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Тема</h4>
            </div>
              <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">
                Авто — следует системной теме. Классика — синий. Warm — красный акцент.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => updateSettings({ theme: "auto" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1",
                    settings.theme === "auto"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                  title="Следует системной теме (светлая/тёмная)"
                >
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate">Авто (Classic)</span>
                </button>
                <button
                  onClick={() => updateSettings({ theme: "auto-warm" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer col-span-2 sm:col-span-1",
                    settings.theme === "auto-warm"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                  title="Следует системной теме с красным акцентом"
                >
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate">Авто (Warm)</span>
                </button>
                <button
                  onClick={() => updateSettings({ theme: "classic-light" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer",
                    settings.theme === "classic-light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Sun className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate">Classic Светлая</span>
                </button>
                <button
                  onClick={() => updateSettings({ theme: "classic-dark" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer",
                    settings.theme === "classic-dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate">Classic Тёмная</span>
                </button>
                <button
                  onClick={() => updateSettings({ theme: "warm-light" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer",
                    settings.theme === "warm-light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                  title="Светлый фон, красный акцент"
                >
                  <Sun className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate">Warm Светлая</span>
                </button>
                <button
                  onClick={() => updateSettings({ theme: "warm-dark" })}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer",
                    settings.theme === "warm-dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                  title="Тёмный вариант"
                >
                  <Moon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium truncate">Warm Тёмная</span>
                </button>
              </div>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="account" className="space-y-6 mt-0">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Webhook className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Webhook</h4>
              </div>
              <p className="text-[10px] text-muted-foreground">
                URL для отправки результата после извлечения (POST JSON).
              </p>
              <label htmlFor="settings-webhook" className="sr-only">
                URL вебхука
              </label>
              <input
                id="settings-webhook"
                type="url"
                placeholder="https://your-server.com/webhook"
                value={settings.webhookUrl ?? ""}
                onChange={(e) =>
                  updateSettings({ webhookUrl: e.target.value.trim() })
                }
                aria-label="URL вебхука для отправки результата"
                className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Публичная ссылка</h4>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Срок действия для новых ссылок «Поделиться» в результате извлечения. После истечения страница по ссылке недоступна.
              </p>
              <label htmlFor="settings-share-expiry" className="sr-only">
                Срок действия публичной ссылки
              </label>
              <select
                id="settings-share-expiry"
                value={
                  settings.shareLinkExpiresDays === null
                    ? "never"
                    : String(settings.shareLinkExpiresDays)
                }
                onChange={(e) => {
                  const v = e.target.value;
                  updateSettings({
                    shareLinkExpiresDays:
                      v === "never" ? null : (Number(v) as 7 | 30 | 365),
                  });
                }}
                aria-label="Срок действия публичной ссылки"
                className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="never">Без срока</option>
                <option value="7">7 дней</option>
                <option value="30">30 дней</option>
                <option value="365">365 дней</option>
              </select>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Notion (API)</h4>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Для кнопки «Отправить в Notion» в экспорте: создайте интеграцию, скопируйте <strong>Internal Integration Secret</strong>,
                укажите страницу-родителя и в Notion откройте ей доступ (Share → интеграция). Токен хранится в браузере и передаётся на
                сервер только при отправке.
              </p>
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                notion.so/my-integrations
              </a>
              <div className="space-y-1">
                <label htmlFor="settings-notion-token" className="text-[10px] text-muted-foreground font-medium">
                  Integration Secret
                </label>
                <input
                  id="settings-notion-token"
                  type="password"
                  autoComplete="off"
                  placeholder="secret_…"
                  value={settings.notionKey ?? ""}
                  onChange={(e) => updateSettings({ notionKey: e.target.value.trim() })}
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="settings-notion-parent" className="text-[10px] text-muted-foreground font-medium">
                  Родительская страница (ссылка или UUID)
                </label>
                <input
                  id="settings-notion-parent"
                  type="text"
                  placeholder="https://www.notion.so/… или 32-символьный id"
                  value={settings.notionParentPageId ?? ""}
                  onChange={(e) =>
                    updateSettings({ notionParentPageId: e.target.value.trim() })
                  }
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                />
              </div>
            </div>

            {session?.user && (
              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="text-sm font-medium">Учётная запись</h4>
                <p className="text-xs text-muted-foreground">
                  {session.user.email}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/profile">Профиль</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/premium">Премиум</Link>
                  </Button>
                  {session.user.isAdmin && (
                    <Button variant="outline" size="sm" asChild className="border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Link href="/admin">Админ-панель</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4">
          <Button className="w-full" onClick={() => setSettingsOpen(false)}>
            Сохранить и закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
