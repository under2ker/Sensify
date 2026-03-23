"use client";

import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => (
    <p className="text-xs text-muted-foreground animate-pulse py-2">Загрузка превью…</p>
  ),
});

/** Тянет react-markdown отдельным чанком только при включённом превью в редакторе. */
export function LazyMarkdownPreview({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
