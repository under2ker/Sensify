"use client";

import { SessionProvider } from "next-auth/react";
import { AccountApiKeysSync } from "@/components/account-api-keys-sync";
import { AccountUserPresetsSync } from "@/components/account-user-presets-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <AccountApiKeysSync />
      <AccountUserPresetsSync />
      {children}
    </SessionProvider>
  );
}
