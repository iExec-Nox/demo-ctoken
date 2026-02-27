import { PortfolioHeader } from "./portfolio-header";

export function DashboardSkeleton() {
  return (
    <>
      <PortfolioHeader />
      <div className="flex items-start gap-[22px] px-10">
        <div className="flex flex-1 items-center justify-center rounded-[32px] border border-surface-border bg-surface py-24 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="size-8 animate-spin rounded-full border-2 border-surface-border border-t-primary" />
            <p className="font-mulish text-sm text-text-muted">
              Loading portfolio...
            </p>
          </div>
        </div>
        <div className="h-96 w-[290px] shrink-0 animate-pulse rounded-3xl border border-surface-border bg-surface" />
      </div>
    </>
  );
}
