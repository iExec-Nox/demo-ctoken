'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { FaucetModalProvider } from '@/components/modals/faucet-modal-provider';
import { SelectiveDisclosureModalProvider } from '@/components/modals/selective-disclosure-modal-provider';
import { TransferModalProvider } from '@/components/modals/transfer-modal-provider';
import { WrapModalProvider } from '@/components/modals/wrap-modal-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { wagmiAdapter, projectId } from '@/lib/wagmi';
import { arbitrumSepolia } from '@reown/appkit/networks';
import { createAppKit, useAppKitTheme } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useState, useEffect, useRef } from 'react';
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi';

let appKitInitialized = false;

function initAppKit() {
  if (appKitInitialized) return;
  appKitInitialized = true;

  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [arbitrumSepolia],
    defaultNetwork: arbitrumSepolia,
    metadata: {
      name: 'Confidential Token | Nox',
      description: 'Manage your confidential assets privately',
      url: 'https://nox.iex.ec',
      icons: ['/nox-icon.png'],
    },
    allowUnsupportedChain: false,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#748eff',
      '--w3m-border-radius-master': '2px',
    },
  });
}

function AppKitThemeSync() {
  const { resolvedTheme } = useTheme();
  const appKitTheme = useAppKitTheme();
  const prevThemeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!resolvedTheme || resolvedTheme === prevThemeRef.current) return;
    prevThemeRef.current = resolvedTheme;

    const mode = resolvedTheme as 'light' | 'dark';
    appKitTheme.setThemeMode(mode);
    appKitTheme.setThemeVariables(
      mode === 'light'
        ? {
            '--w3m-accent': '#748eff',
            '--w3m-border-radius-master': '2px',
            '--w3m-color-mix': '#e3ecff',
            '--w3m-color-mix-strength': 25,
          }
        : {
            '--w3m-accent': '#748eff',
            '--w3m-border-radius-master': '2px',
            '--w3m-color-mix': '#0f1119',
            '--w3m-color-mix-strength': 10,
          }
    );
  }, [resolvedTheme, appKitTheme]);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
  cookies: string | null;
}

export function Providers({ children, cookies }: ProvidersProps) {
  initAppKit();

  const [queryClient] = useState(() => new QueryClient());

  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider
        config={wagmiAdapter.wagmiConfig as Config}
        initialState={initialState}
      >
        <QueryClientProvider client={queryClient}>
          <AppKitThemeSync />
          <TooltipProvider>
            <FaucetModalProvider>
              <WrapModalProvider>
                <TransferModalProvider>
                  <SelectiveDisclosureModalProvider>
                    {children}
                  </SelectiveDisclosureModalProvider>
                </TransferModalProvider>
              </WrapModalProvider>
            </FaucetModalProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
