"use client";

import { motion } from "framer-motion";

function SkeletonLine({ w = "100%" }: { w?: string }) {
  return (
    <div
      className="h-3 rounded-md bg-muted animate-pulse"
      style={{ width: w }}
    />
  );
}

export function ExtractionSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Заголовок и теги */}
      <div className="mb-4">
        <div className="h-6 rounded-md bg-muted/60 animate-pulse w-3/4 mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-5 w-16 rounded-full bg-muted/50 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 flex-1 rounded-lg bg-muted/40 animate-pulse"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>

      {/* Контент — имитация резюме */}
      <div className="flex-1 space-y-4">
        <SkeletonLine w="100%" />
        <SkeletonLine w="95%" />
        <SkeletonLine w="88%" />
        <SkeletonLine w="100%" />
        <SkeletonLine w="70%" />
        <div className="pt-2" />
        <SkeletonLine w="100%" />
        <SkeletonLine w="92%" />
        <SkeletonLine w="65%" />
      </div>
    </div>
  );
}
