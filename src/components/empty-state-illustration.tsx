"use client";

import { motion } from "framer-motion";

interface EmptyStateIllustrationProps {
  variant?: "output" | "history";
}

export function EmptyStateIllustration({ variant = "output" }: EmptyStateIllustrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-24 h-24 mx-auto mb-5"
    >
      {/* Внешнее кольцо */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/50"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      {/* Внутренние слои — имитация "знаний" */}
      <div className="absolute inset-3 rounded-full bg-primary/5 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-primary/60"
          >
            <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4Z" />
            <path d="M8 12h8" />
            <path d="M8 16h8" />
          </svg>
        </div>
      </div>
      {/* Парящие «частицы» */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/30"
          style={{
            top: `${25 + i * 25}%`,
            left: `${70 + (i % 2) * 15}%`,
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}
    </motion.div>
  );
}
