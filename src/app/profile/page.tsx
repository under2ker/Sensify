import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Calendar, Crown, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { GrantPremiumButton } from "@/components/grant-premium-button";
import { ProfileStats } from "@/components/profile-stats";
import { LogoutButton } from "@/components/logout-button";
import { SensifyLogo } from "@/components/sensify-logo";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  if (!user) {
    redirect("/login");
  }

  const createdAt = user.createdAt;
  const sub = user.subscription;

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
            <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight">Профиль</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 outline-none"
      >
        <section className="mb-8 p-6 rounded-2xl border border-border bg-card">
          <h2 className="text-lg font-semibold mb-4">Личные данные</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Регистрация:</span>
              <span>{createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Crown className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Подписка:</span>
              <span>
                {sub && sub.premiumUntil && sub.premiumUntil > new Date()
                  ? `Премиум до ${sub.premiumUntil.toLocaleDateString("ru-RU")}`
                  : "Бесплатная"}
              </span>
            </div>
          </div>
          {session.user.isAdmin && (
            <div className="mt-4 pt-4 border-t border-border">
              <GrantPremiumButton />
            </div>
          )}
        </section>

        <ProfileStats
          isPremium={!!(sub?.premiumUntil && sub.premiumUntil > new Date())}
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Button>
          </Link>
          <LogoutButton />
          {session.user.isAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="gap-2 border-amber-500/40 bg-amber-500/5">
                <Shield className="w-4 h-4" />
                Админ
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
