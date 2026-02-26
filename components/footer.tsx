import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="flex w-full items-center justify-between p-10">
      <Link href="/" className="flex items-center gap-3">
        <div className="relative size-7 overflow-hidden rounded-xl bg-[#748eff]">
          <Image
            src="/nox-icon.png"
            alt="Nox logo"
            fill
            className="object-cover"
          />
        </div>
        <span className="font-[family-name:var(--font-inter)] text-base font-bold tracking-tight text-slate-400">
          Confidential Token
        </span>
      </Link>
      <nav className="flex items-center gap-4 font-[family-name:var(--font-mulish)] text-base font-medium text-slate-500">
        <Link href="#" className="transition-colors hover:text-slate-300">
          Documentation
        </Link>
        <Link href="#" className="transition-colors hover:text-slate-300">
          Github
        </Link>
        <Link href="#" className="transition-colors hover:text-slate-300">
          Terms
        </Link>
      </nav>
      <p className="text-center font-[family-name:var(--font-inter)] text-xs font-medium leading-4 text-slate-600">
        © 2026 Confidential Token Protocol.
        <br />
        All rights reserved.
      </p>
    </footer>
  );
}
