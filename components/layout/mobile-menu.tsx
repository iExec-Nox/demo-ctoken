'use client';

import { useFaucetModal } from '@/components/modals/faucet-modal-provider';
import { DevModeToggle } from '@/components/shared/dev-mode-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Activity', href: '/activity' },
] as const;

export function MobileMenu() {
  const pathname = usePathname();
  const { setOpen: setFaucetOpen } = useFaucetModal();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center md:hidden"
          aria-label="Open menu"
        >
          <span className="material-icons text-text-heading text-[22px]!">
            menu
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="border-surface-border bg-background p-0"
      >
        <SheetHeader className="border-surface-border border-b px-5 py-4">
          <SheetTitle className="font-mulish text-text-heading text-sm font-bold">
            Menu
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`font-mulish rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-surface text-text-heading'
                    : 'text-text-body hover:bg-surface hover:text-text-heading'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setFaucetOpen(true);
            }}
            className="font-mulish text-text-body hover:bg-surface hover:text-text-heading cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
          >
            Faucet
          </button>
        </nav>

        <div className="border-surface-border border-t px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-mulish text-text-muted text-xs font-medium">
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>

        <div className="border-surface-border border-t px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-mulish text-text-muted text-xs font-medium">
              Developer Mode
            </span>
            <DevModeToggle />
          </div>
        </div>

        <div className="border-surface-border mt-auto border-t px-4 py-4">
          <Button
            asChild
            className="bg-primary font-mulish text-primary-foreground hover:bg-primary-hover w-full rounded-xl px-3 py-2 text-sm font-bold shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)]"
          >
            <Link href="#" onClick={() => setOpen(false)}>
              Contact us
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
