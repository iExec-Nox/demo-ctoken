import { Logo } from '@/components/shared/logo';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="flex w-full flex-col items-center gap-5 p-10 md:flex-row md:justify-between">
      <Logo iconSize="sm" font="inter" />
      <nav className="font-mulish text-footer-text flex items-center gap-4 text-sm font-medium md:text-base">
        <Link
          href="https://docs.iex.ec"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-body transition-colors"
        >
          Documentation
        </Link>
        <Link
          href="https://github.com/iExec-Nox"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-body transition-colors"
        >
          Github
        </Link>
        <Link href="/terms" className="hover:text-text-body transition-colors">
          Terms
        </Link>
      </nav>
      <p className="font-mulish text-footer-muted md:font-inter text-center text-xs leading-4 font-medium">
        © 2026 Confidential Token Protocol. All rights reserved.
      </p>
    </footer>
  );
}
