import { createConfig } from "@account-kit/react";
import { alchemy, arbitrumSepolia } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { CONFIG } from "@/lib/config";

export const queryClient = new QueryClient();

export const alchemyConfig = createConfig(
  {
    transport: alchemy({ apiKey: CONFIG.alchemy.apiKey }),
    chain: arbitrumSepolia,
    ssr: true,
  },
  {
    auth: {
      sections: [
        [{ type: "email" as const }],
        [
          {
            type: "social" as const,
            authProviderId: "google" as const,
            mode: "popup" as const,
          },
          {
            type: "social" as const,
            authProviderId: "apple" as const,
            mode: "popup" as const,
          },
        ],
        [
          {
            type: "external_wallets" as const,
            walletConnect: {
              projectId: CONFIG.walletConnect.projectId,
            },
          },
        ],
      ],
      addPasskeyOnSignup: false,
    },
  }
);
