import { TokenRow } from './token-row';
import { Card } from '@/components/ui/card';
import type { TokenBalance } from '@/hooks/use-token-balances';
import type { TokenPrices } from '@/hooks/use-token-prices';
import { toFloat, formatUsd } from '@/lib/format';

interface PublicAssetsProps {
  balances: TokenBalance[];
  prices: TokenPrices;
  address?: string;
}

export function PublicAssets({ balances, prices, address }: PublicAssetsProps) {
  const tokensWithBalance = balances.filter((b) => b.balance > 0n);

  return (
    <Card className="dark:border-surface-border dark:bg-asset-card-bg gap-0 rounded-3xl border-[rgba(255,255,255,0.76)] bg-[rgba(255,255,255,0.08)] py-0 shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="material-icons text-primary text-[18px]!"
          >
            public
          </span>
          <p className="font-mulish text-text-heading text-sm font-bold tracking-[1.4px]">
            Public Assets
          </p>
        </div>
        {address ? (
          <a
            href={`https://sepolia.arbiscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mulish text-text-body hover:text-primary inline-flex items-center gap-1 text-xs transition-colors"
          >
            Visible to explorers
            <span aria-hidden="true" className="material-icons text-[12px]!">
              open_in_new
            </span>
          </a>
        ) : (
          <p className="font-mulish text-text-body text-xs">
            Visible to explorers
          </p>
        )}
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
        <div className="dark:border-surface-border border-t border-white px-6 py-8 text-center">
          <p className="font-mulish text-text-muted text-sm">
            No public assets detected.
          </p>
        </div>
      )}
    </Card>
  );
}
