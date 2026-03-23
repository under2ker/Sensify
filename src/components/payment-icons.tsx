"use client";

/** Иконки платёжных систем, поддерживаемых в РФ */
const paymentSystems = [
  { id: "yookassa", name: "ЮKassa", title: "ЮKassa" },
  { id: "sber", name: "СберПэй", title: "СберПэй" },
  { id: "tinkoff", name: "Тинькофф", title: "Тинькофф" },
  { id: "mir", name: "Мир", title: "Мир" },
  { id: "visa", name: "Visa", title: "Visa" },
  { id: "mc", name: "Mastercard", title: "Mastercard" },
] as const;

export function PaymentIcons({ className }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className ?? ""}`}>
      {paymentSystems.map((ps) => (
        <span
          key={ps.id}
          title={ps.title}
          className="inline-flex items-center justify-center w-14 h-9 rounded-md border border-border/60 overflow-hidden hover:border-border transition-colors"
          aria-label={ps.title}
        >
          <PaymentIcon id={ps.id} name={ps.name} />
        </span>
      ))}
    </div>
  );
}

function PaymentIcon({ id, name }: { id: string; name: string }) {
  const { bg, text, label } = getBrandStyle(id, name);
  if (id === "mc") {
    return (
      <svg width="40" height="26" viewBox="0 0 40 26" fill="none" className="shrink-0">
        <circle cx="14" cy="13" r="8" fill="#EB001B" />
        <circle cx="26" cy="13" r="8" fill="#F79E1B" fillOpacity="0.9" />
        <text x="20" y="16" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">MC</text>
      </svg>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center text-[8px] font-bold rounded px-1.5 py-0.5 min-w-[36px] min-h-[20px]"
      style={{ backgroundColor: bg, color: text }}
      title={name}
    >
      {label}
    </span>
  );
}

function getBrandStyle(
  id: string,
  name: string
): { bg: string; text: string; label: string } {
  switch (id) {
    case "yookassa":
      return { bg: "#6B4EFF", text: "#fff", label: "ЮK" };
    case "sber":
      return { bg: "#21A038", text: "#fff", label: "Сбер" };
    case "tinkoff":
      return { bg: "#FFDD2D", text: "#333", label: "T" };
    case "mir":
      return { bg: "#0F754E", text: "#fff", label: "МИР" };
    case "visa":
      return { bg: "#1A1F71", text: "#fff", label: "VISA" };
    case "mc":
      return { bg: "#EB001B", text: "#fff", label: "MC" };
    default:
      return { bg: "#666", text: "#fff", label: name };
  }
}
