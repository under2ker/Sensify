"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, FileText, History, Search, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Stats = {
  totalRequests: number;
  fileCount: number;
  history: { id: string; title: string | null; source: string; sourceType: string; createdAt: string }[];
};

const sourceTypeLabels: Record<string, string> = {
  url: "URL",
  pdf: "PDF",
  youtube: "YouTube",
  text: "Текст",
  telegram: "Telegram",
  notion: "Notion",
  rss: "RSS",
  substack: "Ссылка (архив)",
  github: "GitHub",
  reddit: "Reddit",
};

export function ProfileStats({ isPremium = false }: { isPremium?: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card animate-pulse">
            <div className="h-5 w-5 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded w-20 mb-1" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <MessageSquare className="w-5 h-5 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold mb-1">Запросы</h3>
          <p className="text-2xl font-bold">{stats?.totalRequests ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">всего извлечений</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <FileText className="w-5 h-5 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold mb-1">Файлы</h3>
          <p className="text-2xl font-bold">{stats?.fileCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">PDF обработано</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <History className="w-5 h-5 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold mb-1">История</h3>
          <p className="text-2xl font-bold">{stats?.history?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">последних записей</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <Crown className="w-5 h-5 text-amber-500 mb-2" />
          <h3 className="text-sm font-semibold mb-1">Премиум</h3>
          <p className="text-2xl font-bold">{isPremium ? "Да" : "Нет"}</p>
          <p className="text-xs text-muted-foreground mt-1">подписка</p>
        </div>
      </div>

      {stats?.history && stats.history.length > 0 && (
        <div className="p-6 rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h3 className="text-sm font-semibold">Последние извлечения</h3>
            <div className="relative flex-1 sm:max-w-xs">
              <label htmlFor="profile-stats-search" className="sr-only">Поиск по извлечениям</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="profile-stats-search"
                type="text"
                placeholder="Поиск по названию или источнику..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
              />
            </div>
          </div>
          <ul className="space-y-2">
            {(() => {
              const filtered = stats.history.filter(
                (e) =>
                  !searchQuery.trim() ||
                  (e.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (e.source || "").toLowerCase().includes(searchQuery.toLowerCase())
              );
              const toShow = filtered.slice(0, 15);
              if (searchQuery.trim() && filtered.length === 0) {
                return (
                  <li className="text-sm text-muted-foreground py-4 text-center">
                    Ничего не найдено по запросу «{searchQuery}»
                  </li>
                );
              }
              return toShow.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate" title={e.title || e.source}>
                  {e.title || e.source || "Без названия"}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {sourceTypeLabels[e.sourceType] || e.sourceType} · {new Date(e.createdAt).toLocaleDateString("ru-RU")}
                </span>
              </li>
              ));
            })()}
          </ul>
          <Link href="/" className="block mt-4">
            <Button variant="outline" size="sm">
              К Sensify
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
