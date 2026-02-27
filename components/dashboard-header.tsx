"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { DevModeToggle } from "@/components/dev-mode-toggle";
import { Button } from "@/components/ui/button";
import { useWalletRedirect } from "@/hooks/use-wallet-redirect";
import { useFaucetModal } from "@/components/faucet-modal-provider";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Activity", href: "/explorer" },
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const { setOpen } = useFaucetModal();
  useWalletRedirect({ onDisconnect: "/" });

  return (
    <header className="flex w-full items-center justify-between bg-background px-10 py-[9px]">
      <div className="flex items-center gap-10">
        <Logo font="inter" />

        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 font-inter text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-surface text-text-heading"
                    : "text-text-body hover:text-text-heading"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-pointer rounded-md px-3 py-1.5 font-inter text-sm font-medium text-text-body transition-colors hover:text-text-heading"
          >
            Faucet
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <ThemeToggle />
        <DevModeToggle />

        <Button
          asChild
          className="rounded-[10px] bg-primary px-3 py-1.5 font-mulish text-sm font-bold text-primary-foreground shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] hover:bg-primary-hover"
        >
          <Link href="#">Contact us</Link>
        </Button>

        <WalletButton />
      </div>
    </header>
  );
}
