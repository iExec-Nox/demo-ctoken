'use client';

import { MobileMenu } from '@/components/layout/mobile-menu';
import { useFaucetModal } from '@/components/modals/faucet-modal-provider';
import { DevModeToggle } from '@/components/shared/dev-mode-toggle';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { WalletButton } from '@/components/shared/wallet-button';
import { Button } from '@/components/ui/button';
import { useWalletRedirect } from '@/hooks/use-wallet-redirect';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Activity', href: '/activity' },
] as const;

export function DashboardHeader() {
  const pathname = usePathname();
  const { setOpen } = useFaucetModal();
  useWalletRedirect({ onDisconnect: '/' });

  return (
    <header className="bg-background flex w-full items-center justify-between px-5 py-[9px] md:px-10">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-4 md:gap-10">
        <Logo font="inter" />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-inter rounded-md px-3 py-[7px] text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-surface text-text-heading'
                    : 'text-text-body hover:text-text-heading'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-inter text-text-body hover:text-text-heading cursor-pointer rounded-md px-3 py-[7px] text-sm font-medium transition-colors"
          >
            Faucet
          </button>
        </nav>
      </div>

      {/* Right: Desktop actions + Mobile menu */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Desktop only */}
        <div className="hidden items-center gap-6 md:flex">
          <ThemeToggle />
          <DevModeToggle />
          <Button
            asChild
            className="bg-primary font-mulish text-primary-foreground hover:bg-primary-hover rounded-[10px] px-3 py-1.5 text-sm font-bold shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)]"
          >
            <Link href="#">Contact us</Link>
          </Button>
        </div>

        {/* Always visible */}
        <WalletButton />

        {/* Mobile only */}
        <MobileMenu />
      </div>
    </header>
  );
}
