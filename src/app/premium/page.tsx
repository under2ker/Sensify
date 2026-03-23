"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  ArrowLeft,
  BookMarked,
  FileText,
  File,
  Code2,
  Zap,
  Info,
  ChevronDown,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { PaymentIcons } from "@/components/payment-icons";
import { SensifyLogo } from "@/components/sensify-logo";
import { toast } from "sonner";

function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-2 py-3 px-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            {item.q}
            <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", open === i && "rotate-180")} />
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="py-2 px-4 pb-3 text-xs text-muted-foreground border-t border-border">
                  {item.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

const premiumFeatures = [
  {
    icon: <BookMarked className="w-5 h-5" />,
    id: "obsidian",
    title: "Obsidian",
    shortDesc: "Vault-ready: frontmatter и структура заметки",
    fullDesc:
      "Один файл Markdown с YAML frontmatter (title, source, date, tags, language) — сразу кладёте в vault. Удобно для конспектов по README, RFC, тредам и статьям без ручного форматирования.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    id: "notion",
    title: "Notion",
    shortDesc: "JSON и отправка страницы по API",
    fullDesc:
      "Скачайте JSON для ручного импорта или нажмите «Отправить в Notion»: создаётся дочерняя страница с блоками (нужны токен интеграции и страница-родитель в настройках).",
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    id: "markdown",
    title: "Markdown",
    shortDesc: "Репозитории, Gist, документация",
    fullDesc:
      "Чистый Markdown без frontmatter — для вставки в README, wiki, блог или второй инструмент. Тот же формат хорошо сочетается с code review и внутренними runbooks.",
  },
  {
    icon: <File className="w-5 h-5" />,
    id: "pdf",
    title: "PDF",
    shortDesc: "A4 для печати и архива",
    fullDesc:
      "Готовый PDF с резюме, идеями, заметками, ссылками и блоками кода — удобно приложить к тикету, разослать команде или хранить офлайн. Кириллица через шрифт Roboto.",
  },
];

export default function PremiumPage() {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "1") {
      toast.success("Оплата прошла успешно! Премиум активирован.");
      window.history.replaceState({}, "", "/premium");
    }
  }, []);

  const handlePurchase = async (plan: "monthly" | "yearly") => {
    if (!session) {
      window.location.href = "/api/auth/signin?callbackUrl=/premium";
      return;
    }
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { confirmationUrl?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Ошибка создания платежа");
      }
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
        return;
      }
      throw new Error("Нет ссылки на оплату");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoadingPlan(null);
    }
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
            <SensifyLogo size={16} />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight">
                <span className="inline-flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500 sm:h-4 sm:w-4" aria-hidden />
                  Премиум
                  <span className="hidden font-normal text-muted-foreground sm:inline">· Sensify</span>
                </span>
              </h1>
              <p className="mt-0.5 hidden max-w-[280px] text-[10px] text-muted-foreground sm:block">
                Экспорт и снятие лимитов для dev-воркфлоу
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                Страница покупки
              </span>
            </div>
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-3xl mx-auto w-full px-4 py-10 outline-none"
      >
        <section className="mb-10 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Премиум</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Оформите премиум, если ведёте базу в <strong>Obsidian</strong> или <strong>Notion</strong>, нужны{" "}
            <strong>Markdown</strong> или <strong>PDF</strong> для репозитория и отчётов — и хотите снять дневные лимиты
            извлечений. Инструменты
            «Углубиться / Сравнить» доступны и на бесплатном тарифе — премиум в первую очередь про экспорт и безлимит.
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Платёжные системы</p>
            <PaymentIcons />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            За что вы платите
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Платные форматы экономят время: не нужно вручную размечать итог разбора issue или статьи — файл уже под ваш
            стек (Obsidian vault, Notion, чистый MD для репозитория).
          </p>
          <div className="space-y-4">
            {premiumFeatures.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-amber-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{feature.shortDesc}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {feature.fullDesc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mb-10 p-6 rounded-2xl border-2 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Премиум — всё включено</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Полный пакет экспорта и снятие дневных лимитов — если регулярно гоняете много ссылок из GitHub, Reddit и RSS.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-medium">Месячный</h3>
              <p className="text-2xl font-bold mt-1">₽299 <span className="text-sm font-normal text-muted-foreground">/мес</span></p>
              <p className="text-[10px] text-muted-foreground mt-2">Отмена в любой момент</p>
              <Button
                onClick={() => handlePurchase("monthly")}
                disabled={loadingPlan !== null}
                className="mt-3 w-full"
                size="sm"
              >
                {loadingPlan === "monthly" ? "Создаём платёж..." : session ? "Оплатить" : "Войти для оплаты"}
              </Button>
            </div>
            <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                Выгодно
              </span>
              <h3 className="font-medium mt-2">Годовой</h3>
              <p className="text-2xl font-bold mt-1">₽2 490 <span className="text-sm font-normal text-muted-foreground">/год</span></p>
              <p className="text-[10px] text-muted-foreground mt-2">Экономия 30%</p>
              <Button
                onClick={() => handlePurchase("yearly")}
                disabled={loadingPlan !== null}
                className="mt-3 w-full"
                size="sm"
              >
                {loadingPlan === "yearly" ? "Создаём платёж..." : session ? "Оплатить" : "Войти для оплаты"}
              </Button>
            </div>
          </div>

          <h3 className="text-sm font-semibold mb-3">Одиночные функции — дешевле</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Нужен только один формат? Оплатите разово или по подписке за выбранную функцию.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <BookMarked className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Только Obsidian</p>
                  <p className="text-[10px] text-muted-foreground">Markdown + frontmatter</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₽99</p>
                <p className="text-[10px] text-muted-foreground">разово</p>
                <Button disabled className="mt-1 opacity-60 cursor-not-allowed" size="sm">
                  Скоро
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Только Notion JSON</p>
                  <p className="text-[10px] text-muted-foreground">JSON для импорта</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₽99</p>
                <p className="text-[10px] text-muted-foreground">разово</p>
                <Button disabled className="mt-1 opacity-60 cursor-not-allowed" size="sm">
                  Скоро
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <Code2 className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Только Markdown</p>
                  <p className="text-[10px] text-muted-foreground">Чистый markdown</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">₽99</p>
                <p className="text-[10px] text-muted-foreground">разово</p>
                <Button disabled className="mt-1 opacity-60 cursor-not-allowed" size="sm">
                  Скоро
                </Button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4">
            Подписка месяц/год оплачивается через подключённую систему на сервере. Разовые тарифы по ₽99 — в очереди на
            реализацию.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            Сравнение тарифов
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium">Возможность</th>
                  <th className="text-center py-3 px-4 font-medium">Бесплатный</th>
                  <th className="text-center py-3 px-4 font-medium bg-amber-500/10">Премиум</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4">Извлечение знаний</td>
                  <td className="text-center py-3 px-4">3 (гости) / 10 (аккаунт) / день</td>
                  <td className="text-center py-3 px-4 bg-amber-500/5">Без ограничений</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Экспорт Obsidian</td>
                  <td className="text-center py-3 px-4"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center py-3 px-4 bg-amber-500/5"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Экспорт Notion JSON</td>
                  <td className="text-center py-3 px-4"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center py-3 px-4 bg-amber-500/5"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Отправка страницы в Notion (API)</td>
                  <td className="text-center py-3 px-4"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center py-3 px-4 bg-amber-500/5"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Экспорт Markdown (файл)</td>
                  <td className="text-center py-3 px-4"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center py-3 px-4 bg-amber-500/5"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Экспорт PDF (A4)</td>
                  <td className="text-center py-3 px-4"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center py-3 px-4 bg-amber-500/5"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Буфер и «Красивый текст»</td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-3 px-4 bg-amber-500/5"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">AI-функции (Углубиться, Сравнить)</td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-3 px-4 bg-amber-500/5"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Сохранение страницы целиком</td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-3 px-4 bg-amber-500/5"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            Часто задаваемые вопросы
          </h2>
          <FAQ items={[
            {
              q: "Как работает бесплатный лимит?",
              a: "Гости (без аккаунта) — до 3 извлечений в день. Зарегистрированные бесплатные пользователи — до 10 в день. Лимит обновляется каждые сутки. Премиум-подписчики не ограничены.",
            },
            {
              q: "Можно ли отменить подписку?",
              a: "Да. Отмена подписки возможна в любой момент. Доступ сохранится до конца оплаченного периода.",
            },
            {
              q: "Принимаются ли корпоративные заказы?",
              a: "Да, для команд и организаций есть отдельные тарифы. Свяжитесь с нами для обсуждения условий.",
            },
            {
              q: "Что такое «сохранение страницы»?",
              a: "Текущая страница (README, статья, пост) сохраняется через Readability в один Markdown с заголовком и ссылкой на источник — удобно открыть в редакторе или положить рядом с извлечённым резюме.",
            },
          ]} />
        </section>

        <div className="text-center">
          <Link href="/">
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Вернуться на главную
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
