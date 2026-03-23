"use client";
// При изменениях в проекте — обновляй changelog
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronRight, GitCompare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/app-config";
import { SensifyLogo } from "@/components/sensify-logo";

const TAG_COLORS: Record<string, string> = {
  FIX: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  FEATURE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  UI: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  IMPROVE: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  UPDATE: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  DOCS: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
};

const TAG_LABELS: Record<string, string> = {
  FIX: "Исправление",
  FEATURE: "Новое",
  UI: "Интерфейс",
  IMPROVE: "Улучшение",
  UPDATE: "Обновление",
  DOCS: "Документация",
};

const changelog: {
  version: string;
  date: string;
  changes: { tag: keyof typeof TAG_COLORS; text: string }[];
}[] = [
  {
    version: "1.9.3",
    date: "2026-03-23",
    changes: [
      { tag: "FEATURE", text: "Админка: журнал платежей ЮKassa (таблица), API GET /api/admin/payments." },
      { tag: "IMPROVE", text: "Webhook ЮKassa: запись в БД PaymentLog (идемпотентно по id платежа), сумма/валюта если пришли в уведомлении." },
      { tag: "UPDATE", text: "После обновления: npx prisma db push (или migrate) — новая таблица payment_logs." },
      { tag: "UPDATE", text: "Версия приложения 1.9.3." },
    ],
  },
  {
    version: "1.9.2",
    date: "2026-03-23",
    changes: [
      { tag: "FIX", text: "Экспорт: предпросмотр без премиума — фрагмент текста (~920 симв.), блокировка copy/cut/контекстного меню и выделения; с премиумом — полный текст и можно копировать." },
      { tag: "FIX", text: "Перед скачиванием премиум-форматов и при открытии предпросмотра повторная проверка /api/user/premium; Notion — fetchHasPremium перед отправкой." },
      { tag: "DOCS", text: "docs/SECURITY_PREMIUM.md — где защита на сервере и ограничения клиентского экспорта." },
      { tag: "UPDATE", text: "Версия приложения 1.9.2." },
    ],
  },
  {
    version: "1.9.1",
    date: "2026-03-23",
    changes: [
      { tag: "FEATURE", text: "«Мои пресеты» в панели ввода: сохранить текущий пресет, качество и свой промпт (до 14 шт., только в браузере)." },
      { tag: "DOCS", text: "docs/DATABASE_PRODUCTION.md — ориентир по миграции с SQLite на облако (Turso и др.)." },
      { tag: "IMPROVE", text: "E2E: публичные страницы /changelog, /premium, /about (public-pages.spec.ts)." },
      { tag: "UPDATE", text: "Версия приложения 1.9.1." },
    ],
  },
  {
    version: "1.9.0",
    date: "2026-03-22",
    changes: [
      { tag: "IMPROVE", text: "Главная: ленивая загрузка OutputPanel, ExportPanel, HistorySidebar (меньше первый JS-чанк; скелетоны при подгрузке)." },
      { tag: "IMPROVE", text: "Редактор блоков: превью Markdown через отдельный чанк (LazyMarkdownPreview)." },
      { tag: "IMPROVE", text: "OutputPanel: React.memo для карточек, копирования, favicon-заглушки — меньше лишних перерисовок." },
      { tag: "IMPROVE", text: "In-memory rate limit: периодическая очистка устаревших слотов Map (долгоживущий процесс)." },
      { tag: "UI", text: "A11y: SkipToContent (фокус и прокрутка к #main-content) + якорь на основных страницах; X-Powered-By отключён." },
      { tag: "IMPROVE", text: "E2E: тест skip-link на главной (Playwright)." },
      { tag: "UPDATE", text: "Версия приложения 1.9.0." },
    ],
  },
  {
    version: "1.8.9",
    date: "2026-03-22",
    changes: [
      { tag: "IMPROVE", text: "Перфоманс: zustand useShallow на главной и в панелях; ThemeToggle подписан только на тему; настройки — dynamic import (меньше первый бандл)." },
      { tag: "IMPROVE", text: "Next.js: optimizePackageImports для lucide-react и framer-motion." },
      { tag: "FIX", text: "API: burst rate limit на POST /api/extract (гость ~14/мин, автор ~48/мин с IP) — дополнительно к дневным лимитам." },
      { tag: "DOCS", text: "docs/PERFORMANCE_NOTES.md — сводка оптимизаций и ограничений in-memory лимитов." },
      { tag: "UPDATE", text: "Версия приложения 1.8.9." },
    ],
  },
  {
    version: "1.8.8",
    date: "2026-03-22",
    changes: [
      { tag: "FIX", text: "Экспорт: кнопка «Отправить в Notion» — объявлены состояние notionSending и settings из стора (исправлен ReferenceError)." },
      { tag: "IMPROVE", text: "API-ключи Groq и Gemini из аккаунта подгружаются сразу после входа (без открытия «Настроек»)." },
      { tag: "FIX", text: "Лимит проверок ключей: до 40 запросов в минуту с одного IP на /api/verify-groq и /api/verify-gemini (in-memory; для кластера — позже Redis/Edge)." },
      { tag: "DOCS", text: "Древо эволюции продукта: docs/PROJECT_HISTORY_TREE.md (идея → реализация; детали — changelog)." },
      { tag: "UPDATE", text: "Версия приложения 1.8.8." },
    ],
  },
  {
    version: "1.8.7",
    date: "2026-03-22",
    changes: [
      { tag: "UI", text: "Текстовый логотип «Sensify» в шапке ещё компактнее; предпросмотр экспорта без выделения и копирования." },
      { tag: "FEATURE", text: "Notion (премиум): отправка страницы через API — настройки Аккаунт (токен + родитель), кнопка в экспорте; см. docs/NOTION_EXPORT.md." },
      { tag: "UPDATE", text: "Версия приложения 1.8.7." },
    ],
  },
  {
    version: "1.8.6",
    date: "2026-03-22",
    changes: [
      { tag: "UI", text: "Шапка главной: в центре крупный текстовый логотип «Sensify» (без отдельной иконки и подзаголовка)." },
      { tag: "FEATURE", text: "Экспорт PDF (премиум): A4, кириллица (Roboto с fonts.gstatic), разделы как в результате извлечения." },
      { tag: "UPDATE", text: "Версия приложения 1.8.6." },
    ],
  },
  {
    version: "1.8.5",
    date: "2026-03-16",
    changes: [
      { tag: "UI", text: "Шапка: убран бейдж «Облачный AI» / «Локальный AI»; провайдер по-прежнему выбирается в настройках." },
      { tag: "DOCS", text: "README: актуализированы панель ввода и блок «Не реализовано»; добавлен docs/PLANNED_FEATURES.md (указатель к ТЗ)." },
      { tag: "UPDATE", text: "Версия приложения 1.8.5." },
    ],
  },
  {
    version: "1.8.4",
    date: "2025-03-16",
    changes: [
      { tag: "IMPROVE", text: "GitHub: README и файлы через API/raw, issue и pull request — текст из GitHub API; при ошибке — как раньше по HTML." },
      { tag: "IMPROVE", text: "Reddit: разбор треда через .json (пост и выборка комментариев по рейтингу); короткие ссылки учитывают редирект." },
      { tag: "UPDATE", text: "Версия приложения 1.8.4." },
    ],
  },
  {
    version: "1.8.3",
    date: "2025-03-16",
    changes: [
      { tag: "DOCS", text: "Описание webhook для разработчиков: docs/WEBHOOK_DEVELOPERS.md (POST после извлечения)." },
      { tag: "IMPROVE", text: "Страница «О проекте»: фокус на разработчиков, порядок источников, FAQ и экспорт." },
      { tag: "IMPROVE", text: "Страница «Премиум»: копирайт под dev; в сравнении тарифов уточнены бесплатный экспорт и Markdown-файл." },
      { tag: "UI", text: "Подвал сайта: подзаголовок в духе ниши (репозитории, треды, доки → заметки)." },
      { tag: "UPDATE", text: "Версия приложения 1.8.3." },
    ],
  },
  {
    version: "1.8.2",
    date: "2025-03-16",
    changes: [
      { tag: "IMPROVE", text: "Улучшена стабильность и качество сборки проекта." },
      { tag: "IMPROVE", text: "Поддержка Docker для удобного развёртывания." },
      { tag: "FIX", text: "Ограничение на частую регистрацию: до 5 попыток в час с одного устройства — защита от спама." },
      { tag: "FIX", text: "Ускорена загрузка списка пользователей в админке." },
      { tag: "IMPROVE", text: "Регулярная проверка безопасности зависимостей." },
    ],
  },
  {
    version: "1.8.1",
    date: "2025-03-16",
    changes: [
      { tag: "FIX", text: "Дополнительная защита платёжных уведомлений от подделки." },
      { tag: "FIX", text: "Блокировка запросов к внутренним адресам — повышена безопасность." },
      { tag: "FIX", text: "Настройка контактов администратора через переменные окружения." },
    ],
  },
  {
    version: "1.8.0",
    date: "2025-03-16",
    changes: [
      { tag: "FEATURE", text: "Интеграция ЮKassa: оплата премиума (месячный/годовой план)." },
      { tag: "FEATURE", text: "Лимит бесплатных извлечений: 10 в день для авторизованных, 3 в день для гостей." },
      { tag: "FEATURE", text: "Страница премиум: сравнение тарифов, FAQ, кнопки «Оплатить»." },
      { tag: "FEATURE", text: "Новые источники: Substack, GitHub, Reddit." },
      { tag: "FEATURE", text: "Сохранение страницы целиком (Mozilla Readability + Markdown)." },
      { tag: "FEATURE", text: "AI-функции: «Углубиться», «Сравнение заметок», «Вопросы по материалу»." },
      { tag: "FEATURE", text: "Кнопка «Показать работу» с демо-ссылками." },
      { tag: "IMPROVE", text: "Более понятные сообщения об ошибках при сбоях." },
      { tag: "IMPROVE", text: "Повторные попытки при временных сетевых сбоях." },
      { tag: "IMPROVE", text: "Улучшенное логирование для отладки." },
      { tag: "IMPROVE", text: "Редактор: предпросмотр Markdown, отмена/повтор, горячие клавиши, снимки версий." },
      { tag: "IMPROVE", text: "Сохранение API-ключа Groq в браузере." },
      { tag: "IMPROVE", text: "Служебная проверка работоспособности сервиса." },
      { tag: "DOCS", text: "Обновлена техническая документация проекта." },
    ],
  },
  {
    version: "1.7.0",
    date: "2025-03-16",
    changes: [
      { tag: "UPDATE", text: "Ребрендинг: Personal Knowledge Extractor → Sensify." },
      { tag: "UI", text: "Новый слоган: «Извлекай смысл. Структурируй. Запоминай.»" },
      { tag: "IMPROVE", text: "Сохранение данных при обновлении приложения." },
      { tag: "IMPROVE", text: "Обновлены превью ссылок в соцсетях и страница «О проекте»." },
    ],
  },
  {
    version: "1.6.1",
    date: "2025-03-16",
    changes: [
      { tag: "UI", text: "Источники: аккуратная сетка с иконками и подписями." },
      { tag: "UI", text: "Настройки: удобное расположение блоков на любом экране." },
      { tag: "FIX", text: "Корректное отображение пресетов, качества и тем на узких экранах." },
    ],
  },
  {
    version: "1.6.0",
    date: "2025-03-16",
    changes: [
      { tag: "FEATURE", text: "Поиск по истории извлечений в профиле." },
      { tag: "FEATURE", text: "Повторное извлечение по одному результату с другим пресетом." },
      { tag: "IMPROVE", text: "Кнопка «Заново» — переизвлечь результат в другом формате (конспект, статья, задачи)." },
      { tag: "IMPROVE", text: "История в профиле увеличена до 50 записей, отображается до 15." },
    ],
  },
  {
    version: "1.5.0",
    date: "2025-03-16",
    changes: [
      { tag: "FEATURE", text: "Новые источники: Telegram, Notion, RSS." },
      { tag: "UI", text: "Обновлённая кнопка «Редактировать» с подсказками при наведении." },
      { tag: "IMPROVE", text: "Повторные попытки при сетевых сбоях и понятные сообщения об ошибках." },
      { tag: "IMPROVE", text: "Понятные подсказки при ошибках API-ключа, Ollama, лимитов." },
    ],
  },
  {
    version: "1.4.0",
    date: "2025-03-16",
    changes: [
      { tag: "FEATURE", text: "Редактор текста в блоках «Резюме», «Идеи», «Карточки», «Заметки»." },
      { tag: "IMPROVE", text: "Редактирование результатов перед экспортом." },
      { tag: "UI", text: "Кнопка «Редактировать» в каждом блоке вывода." },
      { tag: "IMPROVE", text: "Быстрое обновление отдельных блоков при редактировании." },
    ],
  },
  {
    version: "1.3.0",
    date: "2025-03-16",
    changes: [
      { tag: "UI", text: "Упрощён хедер главной страницы." },
      { tag: "UI", text: "Страница changelog в классическом формате с тегами и блоками версий." },
      { tag: "IMPROVE", text: "Обновлена типографика на страницах профиля и премиум." },
      { tag: "FIX", text: "Корректное отображение тегов в списке экспорта." },
      { tag: "UPDATE", text: "Обновление версии приложения во всех конфигурациях." },
      { tag: "IMPROVE", text: "Добавлена ссылка на changelog в футере." },
      { tag: "UI", text: "Чёткие карточки для каждой версии в changelog." },
      { tag: "IMPROVE", text: "Улучшена читаемость списка изменений." },
      { tag: "FIX", text: "Исправлена ошибка в панели экспорта." },
      { tag: "DOCS", text: "README обновлён: структура, скрипты, премиум, админка, changelog." },
    ],
  },
  {
    version: "1.2.0",
    date: "2025-03-15",
    changes: [
      { tag: "FEATURE", text: "Разделы «Запросы», «Файлы», «История» в профиле." },
      { tag: "FEATURE", text: "Сохранение извлечений в базу при авторизации." },
      { tag: "FEATURE", text: "Кнопка выхода из профиля." },
      { tag: "UI", text: "Иконки платёжных систем на странице премиум с подписями брендов." },
      { tag: "IMPROVE", text: "Статистика в профиле загружается в фоне — страница открывается быстрее." },
      { tag: "UI", text: "Улучшено отображение списка последних извлечений." },
      { tag: "IMPROVE", text: "Ссылка «К извлечению знаний» в блоке истории профиля." },
      { tag: "IMPROVE", text: "Счётчики запросов и файлов обновляются после каждого извлечения." },
      { tag: "UI", text: "Индикатор загрузки при подгрузке статистики в профиле." },
      { tag: "FEATURE", text: "Получение статистики пользователя для отображения в профиле." },
    ],
  },
  {
    version: "1.1.0",
    date: "2025-03-14",
    changes: [
      { tag: "FEATURE", text: "Регистрация и вход в аккаунт." },
      { tag: "FEATURE", text: "Страница профиля пользователя." },
      { tag: "IMPROVE", text: "Сохранение учётных записей и извлечений в базе данных." },
      { tag: "UI", text: "Отдельные страницы входа и регистрации." },
      { tag: "IMPROVE", text: "Обновлена работа с базой данных." },
      { tag: "DOCS", text: "Документация по настройке авторизации." },
      { tag: "FIX", text: "Корректное сохранение сессии при перезагрузке." },
    ],
  },
  {
    version: "1.0.0",
    date: "2025-03-01",
    changes: [
      { tag: "FEATURE", text: "Формат имён файлов экспорта с транслитерацией кириллицы." },
      { tag: "FEATURE", text: "Формат «Красивый текст» с оглавлением и статистикой." },
      { tag: "FIX", text: "Локализация даты в экспорте." },
      { tag: "FEATURE", text: "Страница премиум с тарифами и описанием форматов." },
      { tag: "FEATURE", text: "Экспорт в Obsidian, Notion, Markdown и буфер обмена." },
      { tag: "UI", text: "Поддержка нескольких тем оформления." },
      { tag: "IMPROVE", text: "Предпросмотр экспорта перед скачиванием." },
      { tag: "FEATURE", text: "История извлечений в боковой панели." },
      { tag: "FIX", text: "Корректная обработка пустых полей в результатах." },
    ],
  },
];

export default function ChangelogPage() {
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    const idx = changelog.findIndex((r) => r.version === APP_VERSION);
    return new Set([idx >= 0 ? idx : 0]);
  });

  const toggle = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="site-header">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="На главную">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <SensifyLogo size={16} className="hidden sm:inline-flex" />
            <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight">История изменений</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 outline-none"
      >
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Changelog</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Все значимые изменения проекта перечислены в обратном хронологическом порядке.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {changelog.map((release, idx) => (
              <section
                key={release.version}
                className={cn(
                  "rounded-2xl border-2 overflow-hidden shadow-md transition-shadow hover:shadow-lg",
                  idx === 0
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-muted/20"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className={cn(
                    "w-full text-left px-6 py-4 cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5",
                    expanded.has(idx) && "border-b",
                    idx === 0 ? "border-primary/20 bg-primary/10" : "border-border bg-background/80"
                  )}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      {expanded.has(idx) ? (
                        <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" />
                      )}
                      <h3 className="text-lg font-bold tracking-tight">Версия {release.version}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums font-medium">{release.date}</span>
                  </div>
                </button>
                {expanded.has(idx) && (
                <ul className="p-5 space-y-3 text-sm text-foreground/90 leading-relaxed">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center min-w-[5.5rem] px-2 py-0.5 rounded border text-[10px] font-semibold shrink-0 text-center",
                          TAG_COLORS[change.tag] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {TAG_LABELS[change.tag] ?? change.tag}
                      </span>
                      <span className="flex-1 pt-0.5">{change.text}</span>
                    </li>
                  ))}
                </ul>
                )}
              </section>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
