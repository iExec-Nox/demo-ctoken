"use client";

import { useState, useEffect } from "react";
import { useWalletClient } from "wagmi";
import { createViemHandleClient, type HandleClient } from "@iexec-nox/handle";
import { useSignerStatus, useSmartAccountClient } from "@account-kit/react";
import { useWalletAuth, ACCOUNT_TYPE } from "@/hooks/use-wallet-auth";

export function useHandleClient() {
  const { data: walletClient } = useWalletClient();
  const { type, smartAccountAddress } = useWalletAuth();
  const signerStatus = useSignerStatus();

  // SCA path — get the smart account client (handles ERC-1271 signing)
  const { client: smartAccountClient } = useSmartAccountClient({
    type: ACCOUNT_TYPE,
  });

  const [handleClient, setHandleClient] = useState<HandleClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // EOA path — use wagmi wallet client directly
      if (type === "eoa" && walletClient) {
        try {
          const client = await createViemHandleClient(walletClient);
          if (!cancelled) {
            setHandleClient(client);
            setError(null);
          }
        } catch (err) {
          if (!cancelled) {
            console.error("[useHandleClient] EOA createViemHandleClient failed:", err);
            setError(err instanceof Error ? err.message : String(err));
            setHandleClient(null);
          }
        }
        return;
      }

      // SCA path — @iexec-nox/handle expects either a viem WalletClient or SmartAccount.
      // Account Kit's SmartAccountClient satisfies neither type guard out of the box:
      //   - isViemWalletClient needs getAddresses (missing)
      //   - isViemSmartAccount needs type:'smart', getAddress, signTypedData, client
      // We create a lightweight wrapper that satisfies isViemSmartAccount and delegates
      // signing to the SmartAccountClient (which handles ERC-1271 correctly).
      if (type === "sca" && smartAccountClient && smartAccountAddress && signerStatus.isConnected) {
        try {
          const smartAccountLike = {
            type: "smart" as const,
            getAddress: async () => smartAccountAddress,
            signTypedData: async (typedData: Record<string, unknown>) => {
              // Account Kit's client action destructures as { typedData } — not flat params.
              // @iexec-nox/handle's SmartAccountAdapter passes EIP712TypedData directly.
              return smartAccountClient.signTypedData({ typedData } as any);
            },
            client: smartAccountClient,
          };
          const client = await createViemHandleClient(smartAccountLike as any);
          if (!cancelled) {
            setHandleClient(client);
            setError(null);
          }
        } catch (err) {
          if (!cancelled) {
            console.error("[useHandleClient] SCA createViemHandleClient failed:", err);
            setError(err instanceof Error ? err.message : String(err));
            setHandleClient(null);
          }
        }
        return;
      }

      // Not ready yet — reset
      if (!cancelled) setHandleClient(null);
    }

    init();
    return () => { cancelled = true; };
  }, [type, walletClient, smartAccountClient, smartAccountAddress, signerStatus.isConnected]);

  return { handleClient, error };
}
