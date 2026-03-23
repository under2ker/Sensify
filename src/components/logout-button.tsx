"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => signOut({ callbackUrl: "/" })}>
      <LogOut className="w-4 h-4" />
      Выйти
    </Button>
  );
}
