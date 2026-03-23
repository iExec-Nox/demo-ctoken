"use client";

import { useAuthModal } from "@account-kit/react";

export function useConnectWallet() {
  const { openAuthModal } = useAuthModal();

  return { connect: openAuthModal };
}
