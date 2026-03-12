import type { ReactNode } from 'react';

interface InfoCardProps {
  children: ReactNode;
  className?: string;
}

export function InfoCard({ children, className }: InfoCardProps) {
  return (
    <div
      className={`border-surface-border bg-surface flex w-full gap-4 rounded-2xl border px-3 py-2.5 backdrop-blur-sm md:p-6 ${className ?? ''}`}
    >
      <div className="bg-primary flex size-7 shrink-0 items-center justify-center rounded-full md:size-10">
        <span
          aria-hidden="true"
          className="material-icons text-primary-foreground text-[14px]! md:text-[24px]!"
        >
          info
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mulish text-text-heading text-sm font-bold">
          How it works
        </p>
        <p className="font-mulish text-text-body mt-1 text-xs leading-[19.5px]">
          {children}
        </p>
      </div>
    </div>
  );
}
