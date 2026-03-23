"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteHeaderBar } from "@/components/site-header-bar";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        toast.error("Неверный email или пароль");
        return;
      }
      if (result?.ok) {
        toast.success("Вы вошли в аккаунт");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeaderBar title="Вход" right={<ThemeToggle />} />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex items-center justify-center px-4 py-10 outline-none"
      >
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold mb-6">Войти в аккаунт</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Пароль"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Вход…" : "Войти"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Зарегистрироваться
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Загрузка…</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
