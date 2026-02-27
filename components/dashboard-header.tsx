"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { Logo } from "@/components/logo";
import { WalletButton } from "@/components/wallet-button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Activity", href: "/explorer" },
  { label: "Settings", href: "/settings" },
];

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative h-[22px] w-[40px] cursor-pointer rounded-full border border-[#c2c2c4] bg-[rgba(142,150,170,0.14)]"
    >
      <div
        className={`absolute top-px flex size-[18px] items-center justify-center rounded-[9px] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04),0px_1px_2px_0px_rgba(0,0,0,0.06)] transition-[left] duration-200 ${isDark ? "left-px" : "left-[19px]"}`}
      >
        <span className="material-icons text-[12px]! text-[#5d5d69]">
          {isDark ? "light_mode" : "dark_mode"}
        </span>
      </div>
    </button>
  );
}

function DevModeToggle() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex items-center gap-1">
      <span className="font-inter text-sm font-medium text-slate-400">
        Developer Mode
      </span>
      <button
        onClick={() => setEnabled((prev) => !prev)}
        aria-label={enabled ? "Disable developer mode" : "Enable developer mode"}
        className={`relative h-[14px] w-[32px] cursor-pointer rounded-full transition-colors duration-200 ${enabled ? "bg-[#748eff]" : "bg-[rgba(142,150,170,0.14)]"}`}
      >
        <div
          className={`absolute top-px size-[12px] rounded-full bg-white transition-[left] duration-200 ${enabled ? "left-[18px]" : "left-px"}`}
        />
      </button>
    </div>
  );
}

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const wasConnected = useRef(true);

  useEffect(() => {
    if (!isConnected && wasConnected.current) {
      router.push("/");
    }
    wasConnected.current = isConnected;
  }, [isConnected, router]);

  return (
    <header className="flex w-full items-center justify-between bg-[#1d1d24] px-10 py-[9px]">
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
                    ? "bg-white/5 text-white"
                    : "text-slate-400 hover:text-slate-200"
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
          className="rounded-[10px] bg-[#748eff] px-3 py-1.5 font-mulish text-sm font-bold text-white shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors hover:bg-[#6378e6]"
        >
          Contact us
        </Link>

        <WalletButton />
      </div>
    </header>
  );
}
