'use client';

import { ActionCenter } from './action-center';
import { ConfidentialAssets } from './confidential-assets';
import { DashboardSkeleton } from './dashboard-skeleton';
import { EmptyPortfolio } from './empty-portfolio';
import { PortfolioHeader } from './portfolio-header';
import { PublicAssets } from './public-assets';
import { useTokenBalances } from '@/hooks/use-token-balances';
import { useTokenPrices } from '@/hooks/use-token-prices';
import { useAccount } from 'wagmi';

export function DashboardContent() {
  const { address } = useAccount();
  const { balances, hasAnyBalance, isLoading } = useTokenBalances();
  const { prices } = useTokenPrices();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <PortfolioHeader />
      <div className="flex flex-col items-center gap-5 px-3 pb-6 md:flex-row md:items-start md:gap-[22px] md:px-10 md:pb-0">
        {hasAnyBalance ? (
          <div className="flex w-full max-w-[342px] flex-col gap-5 md:max-w-none md:flex-1 md:gap-10">
            <PublicAssets
              balances={balances}
              prices={prices}
              address={address}
            />
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
