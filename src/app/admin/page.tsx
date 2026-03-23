import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Crown, UserMinus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminPanel } from "@/components/admin-panel";
import { SensifyLogo } from "@/components/sensify-logo";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    redirect("/");
  }

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
            <div className="flex min-w-0 items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-primary" />
              <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight">Панель администратора</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 outline-none"
      >
        <AdminPanel />
        <div className="mt-6">
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
