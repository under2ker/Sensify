import { cn } from "@/lib/utils";

export type SensifyLogoProps = {
  /** Визуальный размер: число задаёт font-size в px */
  size?: number;
  className?: string;
};

/** Текстовый логотип Sensify — единый стиль как на главной */
export function SensifyLogo({ size = 18, className }: SensifyLogoProps) {
  return (
    <span
      className={cn(
        "shrink-0 select-none font-extrabold tracking-[-0.04em] text-foreground",
        className,
      )}
      style={{
        fontSize: size,
        textShadow:
          "0 1px 2px rgba(0,0,0,0.3), 0 0 14px rgba(125,211,252,0.15), 0 0 1px rgba(255,255,255,0.3)",
      }}
      aria-hidden
    >
      Sensify
    </span>
  );
}
