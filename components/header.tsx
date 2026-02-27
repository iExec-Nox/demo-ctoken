"use client";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { useWalletRedirect } from "@/hooks/use-wallet-redirect";

export function Header() {
  useWalletRedirect({ onConnect: "/dashboard", onDisconnect: "/" });

  return (
    <header className="flex w-full items-center justify-between bg-background px-20 py-6">
      <Logo />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <WalletButton />
      </div>
    </header>
  );
}
