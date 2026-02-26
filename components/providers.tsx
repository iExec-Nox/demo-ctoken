"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { arbitrum, arbitrumSepolia } from "@reown/appkit/networks";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { wagmiAdapter, projectId } from "@/lib/wagmi";

const queryClient = new QueryClient();

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [arbitrumSepolia, arbitrum],
  defaultNetwork: arbitrumSepolia,
  metadata: {
    name: "Confidential Token | Nox",
    description: "Manage your confidential assets privately",
    url: "https://nox.iex.ec",
    icons: ["/nox-icon.png"],
  },
  allowUnsupportedChain: true,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#748eff",
    "--w3m-border-radius-master": "2px",
  },
});

interface ProvidersProps {
  children: React.ReactNode;
  cookies: string | null;
}

export function Providers({ children, cookies }: ProvidersProps) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
