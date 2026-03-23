"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useAuthModal } from "@account-kit/react";
import { arbitrumSepolia } from "@account-kit/infra";

interface UseWalletRedirectOptions {
  onConnect?: string;
  onDisconnect?: string;
}

const TARGET_CHAIN_ID = arbitrumSepolia.id;

export function useWalletRedirect({ onConnect, onDisconnect }: UseWalletRedirectOptions) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { closeAuthModal } = useAuthModal();
  const wasConnected = useRef(isConnected);

  useEffect(() => {
    if (isConnected && address && !wasConnected.current) {
      // Ensure user is on Arbitrum Sepolia
      if (chainId !== TARGET_CHAIN_ID) {
        switchChain({ chainId: TARGET_CHAIN_ID });
      }
      closeAuthModal();
      if (onConnect) router.push(onConnect);
    }
    if (!isConnected && wasConnected.current && onDisconnect) {
      router.push(onDisconnect);
    }
    wasConnected.current = isConnected;
  }, [isConnected, address, chainId, router, onConnect, onDisconnect, closeAuthModal, switchChain]);
}
