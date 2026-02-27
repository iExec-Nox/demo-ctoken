"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { WalletButton } from "@/components/wallet-button";
import { useAppKitAccount } from "@reown/appkit/react";

export function Header() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const wasConnected = useRef(false);

  useEffect(() => {
    if (isConnected && !wasConnected.current) {
      router.push("/dashboard");
    }
    if (!isConnected && wasConnected.current) {
      router.push("/");
    }
    wasConnected.current = isConnected;
  }, [isConnected, router]);

  return (
    <header className="flex w-full items-center justify-between bg-[#1d1d24] px-20 py-6">
      <Logo />
      <WalletButton />
    </header>
  );
}
