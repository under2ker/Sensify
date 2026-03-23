"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";

export function GrantPremiumButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGrant() {
    setLoading(true);
    try {
      const res = await fetch("/api/grant-premium", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Ошибка");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="default"
      className="gap-2"
      onClick={handleGrant}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Crown className="w-4 h-4" />
      )}
      Получить премиум
    </Button>
  );
}
