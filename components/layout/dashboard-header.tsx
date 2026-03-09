"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { WalletButton } from "@/components/shared/wallet-button";
import { DevModeToggle } from "@/components/shared/dev-mode-toggle";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useWalletRedirect } from "@/hooks/use-wallet-redirect";
import { useFaucetModal } from "@/components/modals/faucet-modal-provider";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Activity", href: "/activity" },
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const { setOpen } = useFaucetModal();
  useWalletRedirect({ onDisconnect: "/" });

  return (
    <header className="flex w-full items-center justify-between bg-background px-5 py-[9px] md:px-10">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-4 md:gap-10">
        <Logo font="inter" />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-[7px] font-inter text-sm font-medium transition-colors ${
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
            className="cursor-pointer rounded-md px-3 py-[7px] font-inter text-sm font-medium text-text-body transition-colors hover:text-text-heading"
          >
            Faucet
          </button>
        </nav>
      </div>

      {/* Right: Desktop actions + Mobile menu */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Desktop only */}
        <div className="hidden items-center gap-6 md:flex">
          <ThemeToggle />
          <DevModeToggle />
          <Button
            asChild
            className="rounded-[10px] bg-primary px-3 py-1.5 font-mulish text-sm font-bold text-primary-foreground shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] hover:bg-primary-hover"
          >
            <Link href="#">Contact us</Link>
          </Button>
        </div>

        {/* Always visible */}
        <WalletButton />

        {/* Mobile only */}
        <MobileMenu />
      </div>
    </header>
  );
}
