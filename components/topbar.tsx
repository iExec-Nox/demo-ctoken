"use client";

import { useFaucetModal } from "@/components/faucet-modal-provider";

export function Topbar() {
  const { setOpen } = useFaucetModal();

  return (
    <div className="flex w-full items-center justify-center gap-2 border-b border-topbar-border bg-background px-5 py-3 text-sm font-medium backdrop-blur-sm">
      <span className="text-text-muted">Running on Arbitrum Sepolia Testnet</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-text-heading underline"
      >
        Get Test Tokens
      </button>
    </div>
  );
}
