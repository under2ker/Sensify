import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { SkipToContent } from "@/components/skip-to-content";
import { getCanonicalSiteUrl } from "@/lib/site-url";

const siteUrl = getCanonicalSiteUrl();

export const metadata: Metadata = {
  title: {
    default: "Sensify — AI для разработчиков: GitHub, Reddit, доки → Obsidian",
    template: "%s | Sensify",
  },
  description:
    "Структурируйте знания из GitHub, Reddit, документации, RSS и Telegram. Экспорт в Obsidian, локальный Ollama, webhook. Резюме, заметки, задачи — одним кликом.",
  keywords: [
    "Sensify",
    "разработчик",
    "GitHub",
    "Reddit",
    "Obsidian",
    "документация",
    "RFC",
    "Ollama",
    "извлечение знаний",
    "AI",
    "Markdown",
  ],
  authors: [{ name: "Sensify" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteUrl,
    siteName: "Sensify",
    title: "Sensify — AI для разработчиков",
    description:
      "GitHub, Reddit, доки и статьи → структурированные заметки. Obsidian, Ollama, приватность.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sensify",
    description: "Структурируйте знания из кода, тредов и документации.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=document.documentElement;var dark=['classic-dark','warm-dark'];function ok(t){return['classic-light','classic-dark','warm-light','warm-dark','auto','auto-warm'].indexOf(t)>=0;}function res(t){if(!ok(t))return 'classic-dark';if(t==='auto')return window.matchMedia('(prefers-color-scheme: dark)').matches?'classic-dark':'classic-light';if(t==='auto-warm')return window.matchMedia('(prefers-color-scheme: dark)').matches?'warm-dark':'warm-light';return t;}try{var d=JSON.parse(localStorage.getItem('sensify-storage')||localStorage.getItem('pke-storage')||'{}');var th=(d.state&&d.state.settings&&d.state.settings.theme)||'classic-dark';if(th==='dark')th='classic-dark';if(th==='light')th='classic-light';var r=res(th);s.setAttribute('data-theme',r);if(dark.indexOf(r)>=0)s.classList.add('dark');else s.classList.remove('dark');}catch(e){s.setAttribute('data-theme','classic-dark');s.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <SkipToContent />
        <ThemeProvider>
        <Providers>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "toast-theme",
              style: {
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              },
            }}
          />
        </TooltipProvider>
        </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
