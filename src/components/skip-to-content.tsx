"use client";

/**
 * Переход к основному содержимому: фокус + прокрутка (надёжнее, чем только hash).
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
      onClick={(e) => {
        e.preventDefault();
        const el = document.getElementById("main-content");
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => {
          el.focus({ preventScroll: true });
        }, 0);
      }}
    >
      Перейти к содержимому
    </a>
  );
}
