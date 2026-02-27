"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "nox-dev-mode";

export function DevModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setEnabled(stored === "true");
    }
  }, []);

  function handleChange(checked: boolean) {
    setEnabled(checked);
    localStorage.setItem(STORAGE_KEY, String(checked));
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-inter text-sm font-medium text-text-body">
        Developer Mode
      </span>
      <Switch
        size="sm"
        checked={enabled}
        onCheckedChange={handleChange}
        aria-label={enabled ? "Disable developer mode" : "Enable developer mode"}
      />
    </div>
  );
}
