'use client';

import { useFaucetModal } from '@/components/modals/faucet-modal-provider';

export function Topbar() {
  const { setOpen } = useFaucetModal();

  return (
    <div className="border-topbar-border bg-background flex w-full items-center justify-center gap-2 border-b px-5 py-3 text-[11px] font-medium backdrop-blur-sm md:text-xs lg:text-sm">
      <span className="text-text-muted">
        Running on Arbitrum Sepolia Testnet
      </span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-text-heading cursor-pointer underline"
      >
        Get Test Tokens
      </button>
    </div>
  );
}
