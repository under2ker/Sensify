import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Globe,
  Youtube,
  MessageCircle,
  Github,
  MessageSquare,
  Rss,
  Layout,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "О проекте",
  description:
    "Sensify — AI-ассистент для разработчиков: GitHub, Reddit, документация → структурированные заметки и Obsidian.",
};

export default function AboutPage() {
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
            <h1 className="text-2xl font-bold mb-4">О проекте</h1>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Sensify</strong> заточен под <strong>разработчиков и технических читателей</strong>: собрать смысл из
              репозиториев, обсуждений, документации и статей — и получить резюме, идеи, карточки и заметки, готовые к
              экспорту в <strong>Obsidian</strong> или другой Markdown-воркфлоу.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Доступны облачные модели (Groq, Google Gemini) и <strong>локальная Ollama</strong> — если не хотите
              отправлять текст в чужие API. В настройках можно указать <strong>webhook</strong>: после извлечения
              результат уйдёт POST-запросом на ваш URL (автоматизация, n8n, свой сервер). Подробности — в файле{" "}
              <strong>docs/WEBHOOK_DEVELOPERS.md</strong> в репозитории проекта.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Интеграции, экспорт и мониторинг одной страницей —{" "}
              <Link href="/developers" className="text-primary font-medium hover:underline">
                Разработчикам
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Источники (в приоритете для dev)</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-3">
                <Github className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>GitHub</strong> — README, issues, discussions
                </span>
              </li>
              <li className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>Reddit</strong> — посты и треды
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>Ссылка</strong> — MDN, RFC, блоги, Substack и любой публичный URL
                </span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>Telegram</strong> — публичные посты и каналы
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Rss className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>RSS</strong> — фиды блогов и релизов
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>PDF</strong> — статьи, спецификации, белые книги
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Youtube className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>YouTube</strong> — доклады и туториалы по транскрипту
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>Notion</strong> — публичные страницы по ссылке
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong>Текст</strong> — вставка лога, фрагмента доки или заметки вручную
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Пресеты извлечения
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Подбирайте фокус под задачу: документация, обсуждение в треде, технические заметки, задачи, исследование или
              релизные заметки.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li>По умолчанию, документация, обсуждение / тред, технические заметки</li>
              <li>Задачи (action items), исследование / длинные статьи, релиз / changelog</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">FAQ</h2>
            <dl className="space-y-6">
              <div>
                <dt className="font-medium mb-1">Как работает извлечение?</dt>
                <dd className="text-muted-foreground text-sm">
                  Модель анализирует текст и возвращает структурированный результат: резюме, ключевые идеи, карточки,
                  заметки в Markdown. Можно выбрать пресет, качество (быстро / баланс / глубоко) и язык ответа.
                </dd>
              </div>
              <div>
                <dt className="font-medium mb-1">Нужен ли API-ключ?</dt>
                <dd className="text-muted-foreground text-sm">
                  Для Groq — бесплатный ключ на console.groq.com. Для Gemini — ключ Google AI Studio. Для Ollama ключ не
                  нужен, но модель должна быть запущена локально (<code className="text-xs">ollama serve</code>).
                </dd>
              </div>
              <div>
                <dt className="font-medium mb-1">Можно ли поделиться результатом?</dt>
                <dd className="text-muted-foreground text-sm">
                  Да: «Поделиться» в панели результата создаёт ссылку только для чтения.
                </dd>
              </div>
              <div>
                <dt className="font-medium mb-1">Куда экспортировать?</dt>
                <dd className="text-muted-foreground text-sm">
                  <strong>Obsidian</strong>, <strong>Notion JSON</strong> и <strong>файл Markdown</strong> — в премиуме.
                  Бесплатно: буфер обмена и «Красивый текст». Премиум также снимает дневные лимиты извлечений.
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="mt-12">
          <Link href="/">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Начать извлечение
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
