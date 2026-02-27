"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";
import { useWalletRedirect } from "@/hooks/use-wallet-redirect";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Activity", href: "/explorer" },
  { label: "Settings", href: "/settings" },
];

function DevModeToggle() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex items-center gap-1">
      <span className="font-inter text-sm font-medium text-text-body">
        Developer Mode
      </span>
      <button
        onClick={() => setEnabled((prev) => !prev)}
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? "Disable developer mode" : "Enable developer mode"}
        className={`relative h-[14px] w-[32px] cursor-pointer rounded-full transition-colors duration-200 ${enabled ? "bg-primary" : "bg-surface-border"}`}
      >
        <div
          className={`absolute top-px size-[12px] rounded-full bg-primary-foreground transition-[left] duration-200 ${enabled ? "left-[18px]" : "left-px"}`}
        />
      </button>
    </div>
  );
}

export function DashboardHeader() {
  const pathname = usePathname();
  useWalletRedirect({ onDisconnect: "/" });

  return (
    <header className="flex w-full items-center justify-between bg-background px-10 py-[9px]">
      <div className="flex items-center gap-10">
        <Logo font="inter" />

        <nav className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
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
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <ThemeToggle />
        <DevModeToggle />

        <Link
          href="#"
          className="rounded-[10px] bg-primary px-3 py-1.5 font-mulish text-sm font-bold text-primary-foreground shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors hover:bg-primary-hover"
        >
          Contact us
        </Link>

        <WalletButton />
      </div>
    </header>
  );
}
