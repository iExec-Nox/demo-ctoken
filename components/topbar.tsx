import Link from "next/link";

export function Topbar() {
  return (
    <div className="flex w-full items-center justify-center gap-2 border-b border-topbar-border bg-background px-5 py-3 text-sm font-medium backdrop-blur-sm">
      <span className="text-text-muted">Running on Arbitrum Sepolia Testnet</span>
      <Link href="/faucet" className="text-text-heading underline">
        Get Test Tokens
      </Link>
    </div>
  );
}
