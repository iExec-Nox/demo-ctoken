import { Card } from "@/components/ui/card";

export function ConfidentialAssets() {
  return (
    <Card className="gap-0 rounded-3xl border-surface-border bg-asset-card-bg py-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="material-icons text-[18px]! text-text-heading">
            visibility_off
          </span>
          <p className="font-mulish text-sm font-bold uppercase tracking-[1.4px] text-asset-text-secondary">
            Confidential Assets
          </p>
        </div>
        <p className="font-mulish text-xs text-text-muted">
          Encrypted on-chain
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center gap-3 border-t border-surface-border px-6 py-10">
        <span aria-hidden="true" className="material-icons text-[32px]! text-asset-text-tertiary">
          enhanced_encryption
        </span>
        <p className="font-mulish text-sm text-text-muted">
          No confidential assets yet.
        </p>
        <p className="max-w-md text-center font-mulish text-xs leading-5 text-asset-text-tertiary">
          Wrap your public tokens to create confidential assets. Your balances
          will be encrypted on-chain and hidden from block explorers.
        </p>
      </div>
    </Card>
  );
}
