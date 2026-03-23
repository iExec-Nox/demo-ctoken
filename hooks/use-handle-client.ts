"use client";

import { useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { createViemHandleClient, type HandleClient } from "@iexec-nox/handle";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { entryPoint06Address } from "viem/account-abstraction";
import { toLightSmartAccount } from "permissionless/accounts";
import { useSignerStatus } from "@account-kit/react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { CONFIG } from "@/lib/config";

export function useHandleClient() {
  const { data: walletClient } = useWalletClient();
  const { type, address, smartAccountAddress } = useWalletAuth();
  const signerStatus = useSignerStatus();

  const { data: handleClient = null, error } = useQuery<HandleClient | null>({
    queryKey: ["handle-client", type, address, smartAccountAddress],
    queryFn: async () => {
      // EOA path — use wagmi wallet client directly
      if (type === "eoa" && walletClient) {
        return createViemHandleClient(walletClient);
      }

      // SCA path — create a LightSmartAccount and pass it directly
      // to createViemHandleClient. The handle SDK detects SmartAccount type
      // and uses its signTypedData (signs locally with owner key + ERC-1271).
      if (type === "sca" && smartAccountAddress) {
        const { alchemyConfig } = await import("@/lib/alchemy");
        const signer = alchemyConfig.store.getState().signer;
        if (!signer) throw new Error("Signer not available yet");

        const owner = signer.toViemAccount();
        const alchemyRpcUrl = `https://arb-sepolia.g.alchemy.com/v2/${CONFIG.alchemy.apiKey}`;

        const viemClient = createPublicClient({
          chain: arbitrumSepolia,
          transport: http(alchemyRpcUrl),
        });

        const lightAccount = await toLightSmartAccount({
          client: viemClient,
          owner,
          version: "1.1.0",
          entryPoint: { address: entryPoint06Address, version: "0.6" },
        });

        // SmartAccount has address=smartAccount + signTypedData=local signing
        return createViemHandleClient(lightAccount as any);
      }

      return null;
    },
    enabled:
      (type === "eoa" && !!walletClient) ||
      (type === "sca" && !!smartAccountAddress && signerStatus.isConnected),
    staleTime: Infinity,
    retry: 3,
  });

  const errorMessage = error
    ? (error instanceof Error ? error.message : String(error))
    : null;

  return { handleClient, error: errorMessage };
}
