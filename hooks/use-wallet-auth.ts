"use client";

import {
  useUser,
  useSignerStatus,
  useLogout,
  useAuthModal,
  useAccount,
} from "@account-kit/react";

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

/**
 * Account Kit account type — must be consistent across all hooks.
 * LightAccount is used because ModularAccountV2 is not yet available on Arbitrum Sepolia.
 * Same signer + same type = same deterministic address across sessions.
 */
export const ACCOUNT_TYPE = "LightAccount" as const;

export function useWalletAuth(): UseWalletAuthResult {
  const user = useUser();
  const signerStatus = useSignerStatus();
  const { logout, isLoggingOut } = useLogout();
  const { openAuthModal } = useAuthModal();

  const isConnected = user !== null;
  const type = user?.type;
  const address = user?.address as `0x${string}` | undefined;

  // Smart account address from Account Kit — deterministic, stable across sessions.
  // useAccount returns the on-chain smart account address (NOT the signer address).
  const { address: smartAccountAddress } = useAccount({
    type: ACCOUNT_TYPE,
    skipCreate: type !== "sca",
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
