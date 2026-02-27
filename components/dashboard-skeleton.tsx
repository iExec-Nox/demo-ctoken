import { PortfolioHeader } from "./portfolio-header";

export function DashboardSkeleton() {
  return (
    <>
      <PortfolioHeader />
      <div className="flex items-start gap-[22px] px-10">
        <div className="flex flex-1 items-center justify-center rounded-[32px] border border-white/8 bg-white/3 py-24 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-[#748eff]" />
            <p className="font-mulish text-sm text-slate-400">
              Loading portfolio...
            </p>
          </div>
        </div>
        <div className="h-96 w-[290px] shrink-0 animate-pulse rounded-3xl border border-white/8 bg-white/3" />
      </div>
    </>
  );
}
