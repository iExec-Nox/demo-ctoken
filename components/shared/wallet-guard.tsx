"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/hooks/use-wallet-auth";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, status } = useWalletAuth();

  // Track mount without setState to avoid the lint warning.
  // A ref doesn't trigger re-render, but that's OK — the Account Kit hooks
  // will trigger re-renders as the auth state settles after hydration.
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    if (mountedRef.current && status === "disconnected") {
      router.replace("/");
    }
  }, [status, router]);

  // Before hydration settles or while initializing: match server output (null)
  if (status === "initializing" || !isConnected) return null;

  return <>{children}</>;
}
