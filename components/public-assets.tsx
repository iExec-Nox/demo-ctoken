import type { TokenBalance } from "@/hooks/use-token-balances";
import type { TokenPrices } from "@/hooks/use-token-prices";
import { TokenRow } from "./token-row";

interface PublicAssetsProps {
  balances: TokenBalance[];
  prices: TokenPrices;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getUsdValue(
  balance: TokenBalance,
  prices: TokenPrices
): { usdValue: string; usdNum: number } | null {
  const price = prices[balance.symbol];
  if (!price) return null;
  const num = Number(balance.balance) / 10 ** balance.decimals;
  const usdNum = num * price;
  return { usdValue: formatUsd(usdNum), usdNum };
}

export function PublicAssets({ balances, prices }: PublicAssetsProps) {
  const tokensWithBalance = balances.filter((b) => b.balance > 0n);

  return (
    <div className="flex flex-col rounded-[25px] border border-white/8 bg-[#1d1d24]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="material-icons text-[18px]! text-blue-400">
            public
          </span>
          <p className="font-mulish text-sm font-bold uppercase tracking-[1.4px] text-slate-300">
            Public Assets
          </p>
        </div>
        <p className="font-mulish text-xs text-slate-500">
          Visible to explorers
        </p>
      </div>

      {/* Token rows */}
      {tokensWithBalance.length > 0 ? (
        tokensWithBalance.map((token) => {
          const usd = getUsdValue(token, prices);
          return (
            <TokenRow
              key={token.symbol}
              name={token.name}
              symbol={token.symbol}
              icon={token.icon}
              formatted={token.formatted}
              usdValue={usd?.usdValue}
            />
          );
        })
      ) : (
        <div className="border-t border-white/8 px-6 py-8 text-center">
          <p className="font-mulish text-sm text-slate-500">
            No public assets detected.
          </p>
        </div>
      )}
    </div>
  );
}

export { formatUsd, getUsdValue };
