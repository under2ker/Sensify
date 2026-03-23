"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Lightbulb,
  CreditCard,
  FileCode2,
  ArrowLeft,
  Globe,
  FileText,
  Youtube,
  Type,
  MessageCircle,
  Layout,
  Rss,
  Github,
  MessageSquare,
  Link2,
  ExternalLink,
  Code2,
  ChevronDown,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getFaviconUrl, shortDisplayUrl } from "@/lib/utils";
import type { InputType, LegacySourceType } from "@/types";

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

function sharedPageSourceIcon(t: InputType | LegacySourceType): React.ReactNode {
  if (t === "substack") return <Globe className="w-5 h-5" />;
  return sourceTypeIcons[t] ?? <Globe className="w-5 h-5" />;
}

const outputTabs = [
  { value: "summary", label: "Резюме", icon: <BookOpen className="w-4 h-4" /> },
  { value: "ideas", label: "Идеи", icon: <Lightbulb className="w-4 h-4" /> },
  { value: "flashcards", label: "Карточки", icon: <CreditCard className="w-4 h-4" /> },
  { value: "notes", label: "Заметки", icon: <FileCode2 className="w-4 h-4" /> },
  { value: "code", label: "Код", icon: <Code2 className="w-4 h-4" /> },
  { value: "links", label: "Ссылки", icon: <Link2 className="w-4 h-4" /> },
];

function groupShareLinksByHost(links: { href: string; label: string; description?: string }[]) {
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

interface SharedResult {
  title: string;
  source: string;
  sourceType: InputType | LegacySourceType;
  summary: string;
  keyIdeas?: string[];
  flashcards?: { question: string; answer: string }[];
  structuredNotes: string;
  tags?: string[];
  imageUrl?: string | null;
  extractedLinks?: { href: string; label: string; description?: string }[];
  codeSnippets?: { title: string; language?: string; code: string; explanation: string }[];
}

export default function SharedPage() {
  const params = useParams();
  const id = params?.id as string;
  const [result, setResult] = useState<SharedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/share/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Не найдено");
        return res.json();
      })
      .then(setResult)
      .catch(() => setError("Ссылка не найдена или истекла"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div
        id="main-content"
        tabIndex={-1}
        className="min-h-screen flex items-center justify-center p-4 outline-none"
      >
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div
        id="main-content"
        tabIndex={-1}
        className="min-h-screen flex flex-col items-center justify-center p-4 gap-4 outline-none"
      >
        <p className="text-muted-foreground">{error || "Не найдено"}</p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Button>
        </Link>
      </div>
    );
  }

  const faviconUrl = getFaviconUrl(result.source, result.sourceType);
  const ideas = result.keyIdeas ?? [];
  const cards = result.flashcards ?? [];
  const pageLinks = result.extractedLinks ?? [];
  const codeSnippets = result.codeSnippets ?? [];
  const groupedLinks = groupShareLinksByHost(pageLinks);

  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background outline-none"
    >
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Извлечь свои знания
        </Link>

        {result.imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border border-border bg-muted/30 aspect-video max-h-48">
            <img
              src={result.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden text-muted-foreground">
            {faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex items-center justify-center">{sharedPageSourceIcon(result.sourceType)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{result.title}</h1>
            {result.source && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{result.source}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {(result.tags ?? []).map((tag) => (
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-4">
            {outputTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="summary" className="mt-0">
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h2:text-base prose-h2:font-semibold prose-h2:mt-4 prose-h2:mb-2 prose-h3:text-sm prose-h3:font-medium prose-h3:mt-3 prose-h3:mb-1.5 prose-p:leading-relaxed prose-p:text-foreground/90 prose-li:my-0.5">
              <ReactMarkdown>{result.summary || ""}</ReactMarkdown>
            </div>
          </TabsContent>

          <TabsContent value="ideas" className="mt-0">
            <div className="space-y-3">
              {ideas.map((idea, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{idea}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="flashcards" className="mt-0">
            <div className="space-y-2">
              {cards.map((fc, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <p className="text-sm font-medium mb-1">В: {fc.question}</p>
                  <p className="text-sm text-muted-foreground">О: {fc.answer}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{result.structuredNotes}</ReactMarkdown>
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-0">
            {!codeSnippets.length ? (
              <p className="text-sm text-muted-foreground">В этой публикации нет сохранённых фрагментов кода.</p>
            ) : (
              <div className="space-y-4">
                {codeSnippets.map((s, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-border/60 bg-muted/10">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/25 px-3 py-2">
                      <h3 className="text-sm font-semibold">{s.title}</h3>
                      {s.language ? (
                        <span className="rounded-md bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground ring-1 ring-border/50">
                          {s.language}
                        </span>
                      ) : null}
                    </div>
                    <pre className="m-0 max-h-72 overflow-auto border-b border-border/40 bg-muted/35 p-3 font-mono text-[11px] leading-relaxed">
                      {s.code}
                    </pre>
                    <p className="p-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{s.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="mt-0">
            {!pageLinks.length ? (
              <p className="text-sm text-muted-foreground">
                Ссылки не были сохранены в этой публикации или их не было в источнике.
              </p>
            ) : (
              <div className="space-y-5">
                {groupedLinks.map(([host, items]) => (
                  <div key={host}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {host}
                      <span className="ml-2 font-normal normal-case text-muted-foreground/70">({items.length})</span>
                    </h3>
                    <ul className="m-0 list-none space-y-2 p-0">
                      {items.map((l, i) => (
                        <li key={`${l.href}-${i}`} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                          <a
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-start gap-2 break-words text-sm font-medium text-primary hover:underline"
                          >
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="min-w-0">{l.label || shortDisplayUrl(l.href)}</span>
                          </a>
                          {l.description?.trim() ? (
                            <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{l.description.trim()}</p>
                          ) : null}
                          <details className="mt-2">
                            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" />
                              <span className="truncate font-mono" title={l.href}>
                                {shortDisplayUrl(l.href)}
                              </span>
                              <span className="shrink-0 text-[10px] text-muted-foreground/80">· полный адрес</span>
                            </summary>
                            <div className="mt-2 space-y-2 border-l-2 border-primary/20 pl-3">
                              <p className="break-all font-mono text-[11px] leading-snug text-muted-foreground">{l.href}</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => navigator.clipboard.writeText(l.href)}
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
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
