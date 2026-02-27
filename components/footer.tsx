import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="flex w-full items-center justify-between p-10">
      <Logo iconSize="sm" font="inter" />
      <nav className="flex items-center gap-4 font-mulish text-base font-medium text-footer-text">
        <Link href="#" className="transition-colors hover:text-text-body">
          Documentation
        </Link>
        <Link href="#" className="transition-colors hover:text-text-body">
          Github
        </Link>
        <Link href="#" className="transition-colors hover:text-text-body">
          Terms
        </Link>
      </nav>
      <p className="text-center font-inter text-xs font-medium leading-4 text-footer-muted">
        © 2026 Confidential Token Protocol.
        <br />
        All rights reserved.
      </p>
    </footer>
  );
}
