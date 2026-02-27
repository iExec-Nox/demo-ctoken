"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="theme-toggle">
        <div
          className="inline-flex h-7 w-[52px] items-center rounded-full border border-white/40 bg-[#2e2e3a]"
          aria-hidden="true"
        >
          <div className="ml-[2px] flex size-[22px] items-center justify-center rounded-full bg-white shadow-md">
            <span className="material-icons-outlined !text-[13px] leading-none text-[#555]">
              light_mode
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="theme-toggle">
      <Switch
        checked={!isDark}
        onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
        className="!h-7 !w-[52px] cursor-pointer border-white/40 bg-[#2e2e3a] shadow-none data-[state=checked]:border-black/15 data-[state=checked]:bg-[#c5c9d6] dark:data-[state=unchecked]:bg-[#2e2e3a]"
        thumbClassName="!size-[22px] bg-white! shadow-md"
        thumbChildren={
          <span className="material-icons-outlined !text-[13px] leading-none text-[#555]">
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        }
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      />
    </div>
  );
}
