'use client';

import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!mounted) {
    return (
      <div className="theme-toggle">
        <div
          className="border-surface-border bg-toggle-track inline-flex h-7 w-[52px] items-center rounded-full border"
          aria-hidden="true"
        >
          <div className="bg-toggle-thumb ml-[2px] flex size-[22px] items-center justify-center rounded-full shadow-md">
            <span
              aria-hidden="true"
              className="material-icons-outlined dark:text-text-muted text-[13px]! leading-none text-[#5d5d69]"
            >
              light_mode
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className="theme-toggle">
      <Switch
        checked={!isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')}
        className="border-surface-border bg-toggle-track data-[state=checked]:border-surface-border data-[state=checked]:bg-toggle-track dark:data-[state=unchecked]:bg-toggle-track h-7! w-[52px]! cursor-pointer shadow-none"
        thumbClassName="size-[22px]! bg-toggle-thumb shadow-md"
        thumbChildren={
          <span
            aria-hidden="true"
            className="material-icons-outlined dark:text-text-muted text-[13px]! leading-none text-[#5d5d69]"
          >
            {isDark ? 'dark_mode' : 'light_mode'}
          </span>
        }
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
    </div>
  );
}
