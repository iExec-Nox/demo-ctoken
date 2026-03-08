"use client";

import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { WalletButton } from "@/components/shared/wallet-button";
import { useWalletRedirect } from "@/hooks/use-wallet-redirect";

export function Header() {
  useWalletRedirect({ onConnect: "/dashboard", onDisconnect: "/" });

  return (
    <header className="flex w-full items-center justify-between bg-background px-5 py-2.5 md:px-20 md:py-6">
      <Logo />
      <div className="flex items-center gap-2 md:gap-3">
        <ThemeToggle />
        <WalletButton />
      </div>
    </header>
  );
}
