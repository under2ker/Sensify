"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Колокол в шапке (v1: пустое состояние; позже — события с сервера). */
export function HeaderNotificationsBell() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-white hover:bg-white/10 hover:text-white"
          aria-label="Уведомления"
          aria-haspopup="menu"
        >
          <Bell className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Уведомления
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Пока нет сообщений. Здесь будут важные новости о подписке и обновлениях продукта.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
