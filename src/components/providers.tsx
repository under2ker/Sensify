"use client";

import { SessionProvider } from "next-auth/react";
import { AccountApiKeysSync } from "@/components/account-api-keys-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <AccountApiKeysSync />
      {children}
    </SessionProvider>
  );
}
