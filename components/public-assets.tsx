import type { TokenBalance } from "@/hooks/use-token-balances";
import type { TokenPrices } from "@/hooks/use-token-prices";
import { toFloat, formatUsd } from "@/lib/format";
import { TokenRow } from "./token-row";

interface PublicAssetsProps {
  balances: TokenBalance[];
  prices: TokenPrices;
}

export function PublicAssets({ balances, prices }: PublicAssetsProps) {
  const tokensWithBalance = balances.filter((b) => b.balance > 0n);

  return (
    <div className="flex flex-col rounded-[25px] border border-surface-border bg-asset-card-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[18px]! text-primary">
            public
          </span>
          <p className="font-mulish text-sm font-bold uppercase tracking-[1.4px] text-asset-text-secondary">
            Public Assets
          </p>
        </div>
        <p className="font-mulish text-xs text-text-muted">
          Visible to explorers
        </p>
      </div>

      {/* Token rows */}
      {tokensWithBalance.length > 0 ? (
        tokensWithBalance.map((token) => {
          const price = prices[token.symbol];
          const usdValue = price
            ? formatUsd(toFloat(token.balance, token.decimals) * price)
            : undefined;
          return (
            <TokenRow
              key={token.symbol}
              name={token.name}
              symbol={token.symbol}
              icon={token.icon}
              formatted={token.formatted}
              usdValue={usdValue}
            />
          );
        })
      ) : (
        <div className="border-t border-surface-border px-6 py-8 text-center">
          <p className="font-mulish text-sm text-text-muted">
            No public assets detected.
          </p>
        </div>
      )}
    </div>
  );
}
