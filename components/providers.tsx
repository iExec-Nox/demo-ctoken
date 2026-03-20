"use client";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { FaucetModalProvider } from "@/components/modals/faucet-modal-provider";
import { WrapModalProvider } from "@/components/modals/wrap-modal-provider";
import { TransferModalProvider } from "@/components/modals/transfer-modal-provider";
import { SelectiveDisclosureModalProvider } from "@/components/modals/selective-disclosure-modal-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlchemyAccountProvider } from "@account-kit/react";
import { cookieToInitialState } from "@account-kit/core";
import { WagmiProvider } from "wagmi";
import { alchemyConfig, queryClient } from "@/lib/wagmi";

interface ProvidersProps {
  children: React.ReactNode;
  cookies: string | null;
}

export function Providers({ children, cookies }: ProvidersProps) {
  const initialState = cookieToInitialState(alchemyConfig, cookies ?? undefined);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
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
    </ThemeProvider>
  );
}
