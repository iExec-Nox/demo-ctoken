"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/hooks/use-wallet-auth";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, status } = useWalletAuth();

  useEffect(() => {
    if (status === "disconnected") {
      router.replace("/");
    }
  }, [status, router]);

  // Don't render while initializing (session restoring) or not connected
  if (status === "initializing" || !isConnected) return null;

  return <>{children}</>;
}
