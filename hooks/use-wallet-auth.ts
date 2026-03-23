"use client";

import { useUser, useSignerStatus, useLogout, useAuthModal } from "@account-kit/react";

type WalletStatus = "connected" | "disconnected" | "initializing" | "authenticating";

interface UseWalletAuthResult {
  isConnected: boolean;
  address: `0x${string}` | undefined;
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
  const address = user?.address as `0x${string}` | undefined;
  const type = user?.type;

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
    type,
    status,
    logout,
    isLoggingOut,
    connect: openAuthModal,
  };
}
