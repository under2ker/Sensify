"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Crown,
  UserMinus,
  Loader2,
  RefreshCw,
  Users,
  Sparkles,
  BarChart3,
  Search,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  extractionCount?: number;
  pdfCount?: number;
  subscription: {
    plan: string;
    premiumUntil: string | null;
  } | null;
};

type PaymentRow = {
  id: string;
  yookassaPaymentId: string;
  email: string;
  plan: string;
  amountValue: string | null;
  currency: string | null;
  status: string;
  createdAt: string;
};

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const USERS_PER_PAGE = 15;

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки");
      }
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPayments() {
    setPaymentsLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки");
      }
      const data = (await res.json()) as PaymentRow[];
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки платежей");
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    fetchPayments();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    const email = grantEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Введите email");
      return;
    }
    setGrantLoading(true);
    try {
      const res = await fetch("/api/grant-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      toast.success(`Премиум выдан пользователю ${email}`);
      setGrantEmail("");
      fetchUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка выдачи премиума");
    } finally {
      setGrantLoading(false);
    }
  }

  async function handleRevoke(email: string) {
    setRevoking(email);
    try {
      const res = await fetch("/api/revoke-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      toast.success(`Премиум снят с ${email}`);
      fetchUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка снятия премиума");
    } finally {
      setRevoking(null);
    }
  }

  function isPremium(u: User): boolean {
    const until = u.subscription?.premiumUntil;
    return !!until && new Date(until) > new Date();
  }

  const premiumCount = users.filter(isPremium).length;
  const totalExtractions = users.reduce((s, u) => s + (u.extractionCount ?? 0), 0);
  const activeCount = users.filter((u) => (u.extractionCount ?? 0) > 0).length;

  const q = searchQuery.trim().toLowerCase();
  const filteredUsers = q
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.name ?? "").toLowerCase().includes(q)
      )
    : users;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * USERS_PER_PAGE,
    page * USERS_PER_PAGE
  );

  return (
    <div className="space-y-8">
      {/* Quick stats (ТЗ п.3.7) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <Users className="w-5 h-5 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold mb-1">Пользователей</h3>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <Crown className="w-5 h-5 text-amber-500 mb-2" />
          <h3 className="text-sm font-semibold mb-1">Премиум</h3>
          <p className="text-2xl font-bold">{premiumCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <BarChart3 className="w-5 h-5 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold mb-1">Извлечений</h3>
          <p className="text-2xl font-bold">{totalExtractions}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <Sparkles className="w-5 h-5 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold mb-1">Активных</h3>
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">с хотя бы 1 запросом</p>
        </div>
      </div>

      <section className="p-6 rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-black/5">
        <h2 className="text-lg font-semibold mb-4">Выдать премиум</h2>
        <form onSubmit={handleGrant} className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="admin-grant-email" className="text-xs text-muted-foreground sr-only">
              Email пользователя для выдачи премиума
            </label>
            <input
              id="admin-grant-email"
              type="email"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="email@example.com"
              aria-label="Email пользователя для выдачи премиума"
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
            />
          </div>
          <Button type="submit" disabled={grantLoading} className="gap-2">
            {grantLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Crown className="w-4 h-4" />
            )}
            Выдать премиум
          </Button>
        </form>
      </section>

      <section className="p-6 rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-black/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Платежи ЮKassa</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchPayments()}
            disabled={paymentsLoading}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${paymentsLoading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Записи создаются при webhook <code className="text-[10px] bg-muted px-1 rounded">payment.succeeded</code> (до 80
          последних).
        </p>
        {paymentsLoading && payments.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Пока нет записей — после первой успешной оплаты они появятся здесь.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium">Дата</th>
                  <th className="text-left py-2 px-2 font-medium">Email</th>
                  <th className="text-left py-2 px-2 font-medium">План</th>
                  <th className="text-left py-2 px-2 font-medium">Сумма</th>
                  <th className="text-left py-2 px-2 font-medium max-w-[140px]">ID ЮKassa</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleString("ru-RU")}
                    </td>
                    <td className="py-2 px-2 font-medium">{p.email}</td>
                    <td className="py-2 px-2">{p.plan}</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      {p.amountValue != null && p.currency
                        ? `${p.amountValue} ${p.currency}`
                        : "—"}
                    </td>
                    <td className="py-2 px-2 font-mono text-[10px] text-muted-foreground break-all max-w-[140px]">
                      {p.yookassaPaymentId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="p-6 rounded-2xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Пользователи</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="admin-search-users"
                type="text"
                placeholder="Поиск по email или имени..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                aria-label="Поиск пользователей по email или имени"
                className="h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void fetchUsers();
                void fetchPayments();
              }}
              disabled={loading && paymentsLoading}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading || paymentsLoading ? "animate-spin" : ""}`}
              />
              Обновить
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Пользователей пока нет
          </p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Ничего не найдено по запросу «{searchQuery.trim()}»
          </p>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Email</th>
                  <th className="text-left py-3 px-2 font-medium">Имя</th>
                  <th className="text-left py-3 px-2 font-medium">Регистрация</th>
                  <th className="text-left py-3 px-2 font-medium">Запросы</th>
                  <th className="text-left py-3 px-2 font-medium">Файлы</th>
                  <th className="text-left py-3 px-2 font-medium">Премиум</th>
                  <th className="text-left py-3 px-2 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-3 px-2 font-medium">{u.email}</td>
                    <td className="py-3 px-2 text-muted-foreground">{u.name || "—"}</td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="py-3 px-2">{u.extractionCount ?? 0}</td>
                    <td className="py-3 px-2">{u.pdfCount ?? 0}</td>
                    <td className="py-3 px-2">
                      {isPremium(u) ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          до {new Date(u.subscription!.premiumUntil!).toLocaleDateString("ru-RU")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() =>
                            fetch("/api/grant-premium", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: u.email }),
                            })
                              .then((r) => r.json())
                              .then((d) => {
                                if (d.error) throw new Error(d.error);
                                toast.success(`Премиум выдан ${u.email}`);
                                fetchUsers();
                              })
                              .catch((e) => toast.error(e.message))
                          }
                        >
                          <Crown className="w-3.5 h-3.5" />
                          Выдать
                        </Button>
                        {isPremium(u) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-destructive hover:text-destructive"
                            disabled={revoking === u.email}
                            onClick={() => handleRevoke(u.email)}
                          >
                            {revoking === u.email ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserMinus className="w-3.5 h-3.5" />
                            )}
                            Снять
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {filteredUsers.length} пользователей
                {searchQuery.trim() && ` (найдено)`} · стр. {page} из {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  →
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </section>
    </div>
  );
}
