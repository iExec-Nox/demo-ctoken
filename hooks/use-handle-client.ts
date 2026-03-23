"use client";

import { useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { createViemHandleClient, type HandleClient } from "@iexec-nox/handle";
import { useSignerStatus } from "@account-kit/react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { createLightAccount } from "@/lib/smart-account";

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

      // SCA path — create a LightSmartAccount and pass it directly.
      // The handle SDK detects SmartAccount type and uses its signTypedData
      // (signs locally with owner key + ERC-1271 verification).
      if (type === "sca" && smartAccountAddress) {
        const lightAccount = await createLightAccount();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SmartAccount is compatible with ViemClient
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
