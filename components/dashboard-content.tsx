"use client";

import { useMemo } from "react";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { useTokenPrices } from "@/hooks/use-token-prices";
import { toFloat, formatUsd } from "@/lib/format";
import { EmptyPortfolio } from "./empty-portfolio";
import { PublicAssets } from "./public-assets";
import { ConfidentialAssets } from "./confidential-assets";
import { ActionCenter } from "./action-center";
import { PortfolioHeader } from "./portfolio-header";
import { DashboardSkeleton } from "./dashboard-skeleton";

export function DashboardContent() {
  const { balances, hasAnyBalance, isLoading } = useTokenBalances();
  const { prices } = useTokenPrices();

  const totalValue = useMemo(() => {
    let total = 0;
    for (const b of balances) {
      const price = prices[b.symbol];
      if (price && b.balance > 0n) {
        total += toFloat(b.balance, b.decimals) * price;
      }
    }
    return formatUsd(total);
  }, [balances, prices]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <PortfolioHeader totalValue={totalValue} />
      <div className="flex items-start gap-[22px] px-10">
        {hasAnyBalance ? (
          <div className="flex flex-1 flex-col gap-10">
            <PublicAssets balances={balances} prices={prices} />
            <ConfidentialAssets />
          </div>
        ) : (
          <EmptyPortfolio />
        )}
        <ActionCenter hasBalance={hasAnyBalance} />
      </div>
    </>
  );
}
