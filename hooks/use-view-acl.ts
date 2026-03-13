"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { useHandleClient } from "@/hooks/use-handle-client";
import { confidentialTokenAbi } from "@/lib/confidential-token-abi";
import { confidentialTokens } from "@/lib/tokens";
import { ZERO_HANDLE } from "@/lib/contracts";
import type { Handle, HexString } from "@iexec-nox/handle";

async function fetchHandleForUser(
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  tokenAddress: HexString,
  userAddress: HexString
): Promise<HexString | null> {
  try {
    const handle = await publicClient.readContract({
      address: tokenAddress,
      abi: confidentialTokenAbi,
      functionName: "confidentialBalanceOf",
      args: [userAddress],
    });
    return handle && handle !== ZERO_HANDLE ? (handle as HexString) : null;
  } catch {
    return null;
  }
}

async function fetchViewers(
  handleClient: NonNullable<ReturnType<typeof useHandleClient>["handleClient"]>,
  handle: HexString
): Promise<string[]> {
  try {
    const acl = await handleClient.viewACL(handle as Handle<"bytes32">);
    return [...new Set(acl.viewers ?? [])];
  } catch {
    return [];
  }
}

export function useViewACL() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { handleClient } = useHandleClient();

  return useQuery<string[]>({
    queryKey: ["view-acl", address, publicClient?.chain?.id],
    enabled: !!address && !!publicClient && !!handleClient,
    staleTime: 10_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      for (const token of confidentialTokens) {
        const handle = await fetchHandleForUser(
          publicClient!,
          token.confidentialAddress as HexString,
          address! as HexString
        );
        if (handle) return fetchViewers(handleClient!, handle);
      }
      return [];
    },
  });
}