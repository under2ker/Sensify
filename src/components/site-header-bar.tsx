"use client";

import Link from "next/link";
import { SensifyLogo } from "@/components/sensify-logo";
import { cn } from "@/lib/utils";

type SiteHeaderBarProps = {
  title: string;
  /** Например ThemeToggle */
  right?: React.ReactNode;
  maxWidthClass?: string;
  className?: string;
};

/** Компактная шапка для auth и второстепенных экранов */
export function SiteHeaderBar({ title, right, maxWidthClass = "max-w-[600px]", className }: SiteHeaderBarProps) {
  return (
    <header className={cn("site-header", className)}>
      <div className={cn("mx-auto flex h-14 items-center justify-between gap-3 px-4", maxWidthClass)}>
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Sensify — ${title}, на главную`}
        >
          <SensifyLogo size={16} />
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</span>
        </Link>
        {right}
      </div>
    </header>
  );
}
