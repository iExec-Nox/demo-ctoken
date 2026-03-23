"use client";

import {
  useUser,
  useSignerStatus,
  useLogout,
  useAuthModal,
} from "@account-kit/react";
import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { entryPoint06Address } from "viem/account-abstraction";
import { toLightSmartAccount } from "permissionless/accounts";
import { CONFIG } from "@/lib/config";

type WalletStatus = "connected" | "disconnected" | "initializing" | "authenticating";

interface UseWalletAuthResult {
  isConnected: boolean;
  /** Signer address (EOA wallet or Alchemy signer). Always available when connected. */
  address: `0x${string}` | undefined;
  /** Smart account address (only for SCA users). Undefined for EOA. */
  smartAccountAddress: `0x${string}` | undefined;
  type: "eoa" | "sca" | undefined;
  status: WalletStatus;
  logout: () => void;
  isLoggingOut: boolean;
  connect: () => void;
}

export function useWalletAuth(): UseWalletAuthResult {
  const user = useUser();
  const signerStatus = useSignerStatus();
  const { logout, isLoggingOut } = useLogout();
  const { openAuthModal } = useAuthModal();

  const isConnected = user !== null;
  const type = user?.type;
  const address = user?.address as `0x${string}` | undefined;

  // Compute smart account address via useQuery — cached, stable, no flicker.
  // The address is deterministic: same signer always gives same smart account.
  const { data: smartAccountAddress } = useQuery({
    queryKey: ["smart-account-address", address],
    queryFn: async () => {
      const { alchemyConfig } = await import("@/lib/alchemy");
      const signer = alchemyConfig.store.getState().signer;
      if (!signer) throw new Error("Signer not available");

      const owner = signer.toViemAccount();
      const rpcUrl = `https://arb-sepolia.g.alchemy.com/v2/${CONFIG.alchemy.apiKey}`;

      const viemClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(rpcUrl),
      });

      const lightAccount = await toLightSmartAccount({
        client: viemClient,
        owner,
        version: "1.1.0",
        entryPoint: { address: entryPoint06Address, version: "0.6" },
      });

      return lightAccount.address;
    },
    enabled: type === "sca" && !!address && signerStatus.isConnected,
    staleTime: Infinity,  // Address is deterministic — never refetch
    retry: 3,
  });

  let status: WalletStatus = "disconnected";
  if (signerStatus.isInitializing) {
    status = "initializing";
  } else if (signerStatus.isAuthenticating) {
    status = "authenticating";
  } else if (isConnected) {
    status = "connected";
  }

  return {
    isConnected,
    address,
    smartAccountAddress,
    type,
    status,
    logout,
    isLoggingOut,
    connect: openAuthModal,
  };
}
