import {
  createConfig,
  cookieStorage,
  configForExternalWallets,
  type AlchemyAccountsUIConfig,
} from "@account-kit/react";
import { alchemy, arbitrumSepolia } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { CONFIG } from "@/lib/config";

const externalWalletsConfig = configForExternalWallets({
  wallets: ["metamask", "coinbase wallet", "wallet_connect"],
  chainType: ["evm"],
  numFeaturedWallets: 3,
});

const uiConfig: AlchemyAccountsUIConfig = {
  auth: {
    sections: [
      [{ type: "external_wallets", ...externalWalletsConfig.uiConfig }],
    ],
  },
};

export const alchemyConfig = createConfig(
  {
    transport: alchemy({ apiKey: CONFIG.alchemy.apiKey }),
    chain: arbitrumSepolia,
    ssr: true,
    storage: cookieStorage,
    connectors: externalWalletsConfig.connectors,
  } as Parameters<typeof createConfig>[0],
  uiConfig
);

export const queryClient = new QueryClient();
