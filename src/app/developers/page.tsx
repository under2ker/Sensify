import Link from "next/link";
import {
  ArrowLeft,
  Webhook,
  BookMarked,
  Server,
  Activity,
  FileCode2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_GITHUB } from "@/lib/app-config";

export const metadata = {
  title: "Разработчикам",
  description:
    "Sensify для разработчиков: webhook после извлечения, экспорт Obsidian/Markdown, Ollama, мониторинг /api/health.",
};

function webhookDocsUrl(): string | null {
  if (!APP_GITHUB || APP_GITHUB === "#") return null;
  return `${APP_GITHUB.replace(/\/$/, "")}/blob/main/docs/WEBHOOK_DEVELOPERS.md`;
}

export default function DevelopersPage() {
  const hookUrl = webhookDocsUrl();

  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background outline-none"
    >
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="space-y-10">
          <section>
            <h1 className="text-2xl font-bold mb-4">Разработчикам</h1>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Коротко о том, как встроить <strong>Sensify</strong> в свой воркфлоу: автоматизация через webhook,
              экспорт в заметки и локальные модели без облака.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default" size="sm">
                <Link href="/">Открыть приложение</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/about">О проекте</Link>
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Webhook className="w-5 h-5 text-primary shrink-0" aria-hidden />
              Webhook после извлечения
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              В настройках укажите URL — после успешного извлечения результат уходит{" "}
              <strong>POST</strong> с JSON телом (заголовок, резюме, идеи, заметки и т.д.). Удобно для n8n, своего
              бэкенда или очереди задач.
            </p>
            {hookUrl ? (
              <a
                href={hookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <FileCode2 className="w-4 h-4 shrink-0" aria-hidden />
                Документация WEBHOOK_DEVELOPERS.md
                <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">
                Полное описание полей — в файле <code className="text-foreground/90">docs/WEBHOOK_DEVELOPERS.md</code>{" "}
                репозитория.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <BookMarked className="w-5 h-5 text-primary shrink-0" aria-hidden />
              Экспорт и премиум
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Obsidian</strong> (Markdown + frontmatter), чистый <strong>Markdown</strong>,{" "}
              <strong>Notion</strong> (JSON и child page по API), <strong>PDF</strong> — в премиуме. На бесплатном тарифе
              доступны буфер обмена и «Красивый текст».
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/premium">Тарифы</Link>
            </Button>
          </section>

          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Server className="w-5 h-5 text-primary shrink-0" aria-hidden />
              Локальная Ollama
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              В настройках можно выбрать провайдер <strong>Ollama</strong> и указать URL (например{" "}
              <code className="text-foreground/90">http://localhost:11434</code>) — текст не уходит в Groq/Gemini, если так
              настроено.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Activity className="w-5 h-5 text-primary shrink-0" aria-hidden />
              Мониторинг деплоя
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              <code className="text-foreground/90">GET /api/health</code> — доступность БД, режим{" "}
              <strong>turso</strong>/<strong>sqlite</strong>, флаги <strong>rateLimitDistributed</strong> (Upstash) и{" "}
              <strong>paymentsConfigured</strong> (ЮKassa). Без утечки секретов.
            </p>
            <p className="text-xs text-muted-foreground">
              Подробнее: <Link href="/about" className="text-primary hover:underline">О проекте</Link>,{" "}
              <Link href="/changelog" className="text-primary hover:underline">Changelog</Link>,{" "}
              <span className="text-muted-foreground/80">docs в репозитории (DATABASE_PRODUCTION, YOOKASSA_PAYMENTS).</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
