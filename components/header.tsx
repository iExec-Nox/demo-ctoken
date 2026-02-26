import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="flex w-full items-center justify-between bg-[#1d1d24] px-20 py-6">
      <Link href="/" className="flex items-center gap-3">
        <div className="relative size-8 overflow-hidden rounded-xl bg-[#748eff]">
          <Image
            src="/nox-icon.png"
            alt="Nox logo"
            fill
            className="object-cover"
          />
        </div>
        <span className="font-[family-name:var(--font-mulish)] text-xl font-bold tracking-tight text-slate-100">
          Confidential Token
        </span>
      </Link>
      <button className="rounded-lg border border-[rgba(112,136,255,0.1)] bg-[#748eff] px-6 py-2 text-sm font-bold text-white font-[family-name:var(--font-mulish)] transition-colors hover:bg-[#6378e6]">
        Connect Wallet
      </button>
    </header>
  );
}
