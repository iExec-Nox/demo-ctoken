"use client";

import { useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { createViemHandleClient, type HandleClient } from "@iexec-nox/handle";
import { useSignerStatus, useAccount } from "@account-kit/react";
import { useWalletAuth, ACCOUNT_TYPE } from "@/hooks/use-wallet-auth";

export function useHandleClient() {
  const { data: walletClient } = useWalletClient();
  const { type, address, smartAccountAddress } = useWalletAuth();
  const signerStatus = useSignerStatus();

  // Get Account Kit's LightAccount instance (correct address + signing)
  const { account: lightAccount } = useAccount({
    type: ACCOUNT_TYPE,
    skipCreate: type !== "sca",
  });

  const { data: handleClient = null, error } = useQuery<HandleClient | null>({
    queryKey: ["handle-client", type, address, smartAccountAddress],
    queryFn: async () => {
      // EOA path — use wagmi wallet client directly
      if (type === "eoa" && walletClient) {
        return createViemHandleClient(walletClient);
      }

      // SCA path — use Account Kit's LightAccount which has the correct
      // smart account address and signs via the Alchemy signer (ERC-1271).
      if (type === "sca" && lightAccount) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SmartAccount is compatible with ViemClient
        return createViemHandleClient(lightAccount as any);
      }

      return null;
    },
    enabled:
      (type === "eoa" && !!walletClient) ||
      (type === "sca" && !!lightAccount && signerStatus.isConnected),
    staleTime: Infinity,
    retry: 3,
  });

  const errorMessage = error
    ? (error instanceof Error ? error.message : String(error))
    : null;

  return { handleClient, error: errorMessage };
}
