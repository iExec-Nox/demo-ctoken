"use client";

import {
  useUser,
  useSignerStatus,
  useLogout,
  useAuthModal,
} from "@account-kit/react";
import { useQuery } from "@tanstack/react-query";
import { createLightAccount } from "@/lib/smart-account";

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
      const lightAccount = await createLightAccount();
      return lightAccount.address;
    },
    enabled: type === "sca" && !!address && signerStatus.isConnected,
    staleTime: Infinity,
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
