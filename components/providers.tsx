"use client";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { FaucetModalProvider } from "@/components/modals/faucet-modal-provider";
import { WrapModalProvider } from "@/components/modals/wrap-modal-provider";
import { TransferModalProvider } from "@/components/modals/transfer-modal-provider";
import { SelectiveDisclosureModalProvider } from "@/components/modals/selective-disclosure-modal-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AlchemyAccountProvider } from "@account-kit/react";
import { alchemyConfig, queryClient } from "@/lib/alchemy";
import type { AlchemyAccountsProviderProps } from "@account-kit/react";

interface ProvidersProps {
  children: React.ReactNode;
  initialState?: AlchemyAccountsProviderProps["initialState"];
}

export function Providers({ children, initialState }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AlchemyAccountProvider
          config={alchemyConfig}
          queryClient={queryClient}
          initialState={initialState}
        >
          <WagmiProvider config={alchemyConfig._internal.wagmiConfig}>
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
          </WagmiProvider>
        </AlchemyAccountProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
