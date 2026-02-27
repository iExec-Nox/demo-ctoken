import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="flex w-full items-center justify-between p-10">
      <Logo iconSize="sm" font="inter" textColor="text-slate-400" />
      <nav className="flex items-center gap-4 font-mulish text-base font-medium text-slate-500">
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
      <p className="text-center font-inter text-xs font-medium leading-4 text-slate-600">
        © 2026 Confidential Token Protocol.
        <br />
        All rights reserved.
      </p>
    </footer>
  );
}
