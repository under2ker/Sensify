"use client";

import { motion } from "framer-motion";

/** Фоновая сетка точек + мягкий градиент */
export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Градиентный меш */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, hsl(var(--primary) / 0.08), transparent), radial-gradient(ellipse 60% 40% at 0% 50%, hsl(var(--primary) / 0.08), transparent)",
        }}
      />
      {/* Сетка точек */}
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.15) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Лёгкие плавающие частицы (CSS) */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{
              left: `${15 + (i * 7) % 70}%`,
              top: `${10 + (i * 11) % 80}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
