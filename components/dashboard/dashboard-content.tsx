"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
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
  const { address } = useAccount();
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
      <div className="flex flex-col items-center gap-5 px-3 pb-6 md:flex-row md:items-start md:gap-[22px] md:px-10 md:pb-0">
        {hasAnyBalance ? (
          <div className="flex w-full max-w-[342px] flex-col gap-5 md:max-w-none md:flex-1 md:gap-10">
            <PublicAssets balances={balances} prices={prices} address={address} />
            <ConfidentialAssets prices={prices} />
          </div>
        ) : (
          <EmptyPortfolio />
        )}
        <ActionCenter hasBalance={hasAnyBalance} />
      </div>
    </>
  );
}
