import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="flex w-full flex-col items-center gap-5 p-10 md:flex-row md:justify-between">
      <Logo iconSize="sm" font="inter" />
      <nav className="flex items-center gap-4 font-mulish text-sm font-medium text-footer-text md:text-base">
        <Link
          href="https://docs.nox.iex.ec"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-text-body"
        >
          Documentation
        </Link>
        <Link
          href="https://github.com/iExecBlockchainComputing"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-text-body"
        >
          Github
        </Link>
        <Link
          href="/terms"
          className="transition-colors hover:text-text-body"
        >
          Terms
        </Link>
      </nav>
      <p className="text-center font-mulish text-xs font-medium leading-4 text-footer-muted md:font-inter">
        © 2026 Confidential Token Protocol.{" "}
        All rights reserved.
      </p>
    </footer>
  );
}
