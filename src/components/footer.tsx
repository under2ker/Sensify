"use client";

import Link from "next/link";
import { Github, History, Info } from "lucide-react";
import { APP_NAME, APP_VERSION, APP_AUTHOR, APP_GITHUB, APP_LICENSE } from "@/lib/app-config";
import { SensifyLogo } from "@/components/sensify-logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/20 mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <SensifyLogo size={14} />
            <div>
              <p className="text-xs font-medium text-foreground">{APP_NAME}</p>
              <p className="text-[10px] text-muted-foreground">
                v{APP_VERSION} · {APP_AUTHOR} · {year}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 text-[11px] text-muted-foreground">
            {APP_GITHUB && String(APP_GITHUB) !== "#" && (
              <a
                href={APP_GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            )}
            <Link href="/about" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Info className="w-3.5 h-3.5" />
              О проекте
            </Link>
            <Link href="/changelog" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <History className="w-3.5 h-3.5" />
              История изменений
            </Link>
            <span>Лицензия: {APP_LICENSE}</span>
            <span className="hidden sm:inline max-w-[280px] md:max-w-none text-right md:text-left">
              Для разработчиков: репозитории, треды, доки → заметки
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
