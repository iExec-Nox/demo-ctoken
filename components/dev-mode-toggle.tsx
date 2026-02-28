"use client";

import { Switch } from "@/components/ui/switch";
import { useDevMode } from "@/hooks/use-dev-mode";

interface DevModeToggleProps {
  label?: string;
}

export function DevModeToggle({ label = "Developer Mode" }: DevModeToggleProps) {
  const { enabled, toggle } = useDevMode();

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-inter text-sm font-medium text-text-body">
        {label}
      </span>
      <Switch
        size="sm"
        checked={enabled}
        onCheckedChange={toggle}
        aria-label={enabled ? "Disable developer mode" : "Enable developer mode"}
      />
    </div>
  );
}
