"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/hooks/use-wallet-auth";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, status } = useWalletAuth();

  // Prevent hydration mismatch: server always renders null (no user session),
  // so client must also render null on first paint, then check auth after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && status === "disconnected") {
      router.replace("/");
    }
  }, [mounted, status, router]);

  // Before mount or while initializing: show nothing (matches server output)
  if (!mounted || status === "initializing") return null;

  if (!isConnected) return null;

  return <>{children}</>;
}
