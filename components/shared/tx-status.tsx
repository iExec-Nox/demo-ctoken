"use client";

import { cn } from "@/lib/utils";

export type TxState = "idle" | "pending" | "success" | "error";

interface TxStatusProps {
  status: TxState;
  message?: string;
  className?: string;
}

const CONFIG: Record<Exclude<TxState, "idle">, { icon: string; label: string; bg: string; text: string }> = {
  pending: {
    icon: "hourglass_top",
    label: "Pending",
    bg: "bg-tx-pending-bg",
    text: "text-tx-pending-text",
  },
  success: {
    icon: "check_circle",
    label: "Success",
    bg: "bg-tx-success-bg",
    text: "text-tx-success-text",
  },
  error: {
    icon: "error",
    label: "Failed",
    bg: "bg-tx-error-bg",
    text: "text-tx-error-text",
  },
};

export function TxStatus({ status, message, className }: TxStatusProps) {
  if (status === "idle") return null;

  const { icon, label, bg, text } = CONFIG[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 font-mulish text-sm font-medium",
        bg,
        text,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "material-icons text-[16px]!",
          status === "pending" && "animate-spin motion-reduce:animate-none",
        )}
      >
        {icon}
      </span>
      <span>{message ?? label}</span>
    </div>
  );
}
