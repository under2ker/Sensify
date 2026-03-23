"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteHeaderBar } from "@/components/site-header-bar";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка регистрации");
      toast.success("Регистрация успешна. Войдите в аккаунт.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeaderBar title="Регистрация" right={<ThemeToggle />} />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex items-center justify-center px-4 py-10 outline-none"
      >
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6">Создать аккаунт</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="register-email"
                className="text-xs text-muted-foreground font-medium mb-1.5 block"
              >
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="register-password"
                className="text-xs text-muted-foreground font-medium mb-1.5 block"
              >
                Пароль
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Минимум 6 символов"
              />
            </div>
            <div>
              <label
                htmlFor="register-name"
                className="text-xs text-muted-foreground font-medium mb-1.5 block"
              >
                Имя <span className="text-muted-foreground/70">(необязательно)</span>
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Как к вам обращаться"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Регистрация…" : "Зарегистрироваться"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
          <Link href="/" className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" />
            На главную
          </Link>
        </div>
      </main>
    </div>
  );
}
