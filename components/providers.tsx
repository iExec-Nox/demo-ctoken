"use client";

import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { FaucetModalProvider } from "@/components/faucet-modal-provider";
import { WrapModalProvider } from "@/components/wrap-modal-provider";
import { TransferModalProvider } from "@/components/transfer-modal-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { arbitrumSepolia } from "@reown/appkit/networks";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { wagmiAdapter, projectId } from "@/lib/wagmi";

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
      name: "Confidential Token | Nox",
      description: "Manage your confidential assets privately",
      url: "https://nox.iex.ec",
      icons: ["/nox-icon.png"],
    },
    allowUnsupportedChain: false,
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#748eff",
      "--w3m-border-radius-master": "2px",
    },
  });
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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <WagmiProvider
        config={wagmiAdapter.wagmiConfig as Config}
        initialState={initialState}
      >
        <QueryClientProvider client={queryClient}>
          <FaucetModalProvider>
            <WrapModalProvider>
              <TransferModalProvider>{children}</TransferModalProvider>
            </WrapModalProvider>
          </FaucetModalProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
