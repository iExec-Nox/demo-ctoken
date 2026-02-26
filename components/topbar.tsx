import Link from "next/link";

export function Topbar() {
  return (
    <div className="flex w-full items-center justify-center gap-2 border-b border-white/5 bg-[#1d1d24] px-5 py-3 text-sm font-medium backdrop-blur-sm">
      <span className="text-slate-500">Running on Arbitrum Sepolia Testnet</span>
      <Link href="/faucet" className="text-white underline">
        Get Test Tokens
      </Link>
    </div>
  );
}
