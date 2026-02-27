import Link from "next/link";

export function HeroSection() {
  return (
    <section className="flex w-full flex-col items-start gap-10 px-40 py-16">
      <h1 className="w-full text-center font-anybody text-7xl font-bold leading-[72px] tracking-[-3.6px] text-white">
        Try Confidential DeFi Now.
      </h1>
      <p className="w-full text-center font-mulish text-xl leading-7 text-slate-400">
        Connect your wallet to encrypt a token balance
        <br />
        and experience private on-chain transfers in action.
      </p>
      <div className="flex w-full items-start justify-center gap-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-[#748eff] px-5 py-4 text-center font-mulish text-lg font-bold text-white shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors hover:bg-[#6378e6]"
        >
          <span className="material-icons text-xl leading-7">account_balance_wallet</span>
          Try It Now
        </Link>
        <Link
          href="#"
          className="flex h-[60px] items-center justify-center rounded-xl border border-white/8 bg-white/3 px-5 py-4 font-mulish text-lg font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/8"
        >
          Talk to us
        </Link>
      </div>
    </section>
  );
}
