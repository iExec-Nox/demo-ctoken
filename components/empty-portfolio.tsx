import Link from "next/link";

export function EmptyPortfolio() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-[32px] border border-white/8 bg-white/3 px-10 py-24 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-[29px]">
        <div className="flex size-20 items-center justify-center rounded-full border border-white/5 bg-slate-800/50">
          <span className="material-icons text-[36px]! text-slate-500">
            account_balance_wallet
          </span>
        </div>

        <h2 className="font-mulish text-2xl font-bold text-white">
          Your portfolio is empty
        </h2>

        <p className="max-w-sm text-center font-mulish text-base leading-[26px] text-slate-400">
          To explore the Confidential Token demo, you first need testnet assets
          to cover gas and wrap into confidential tokens.
        </p>

        <Link
          href="/faucet"
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#748eff] px-5 py-3 font-mulish text-lg font-bold text-white shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] hover:bg-[#6378e6]"
        >
          <span className="material-icons text-[20px]!">
            account_balance_wallet
          </span>
          Go to Faucets
        </Link>
      </div>
    </div>
  );
}
