"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { fetchSharedWithMe, fetchMyGrants } from "@/lib/subgraph";
import type { DelegatedViewEntry } from "@/lib/delegated-view";
import type { SubgraphHandleRole } from "@/lib/subgraph";

function mapSharedWithMe(roles: SubgraphHandleRole[]): DelegatedViewEntry[] {
  return roles.map((r) => ({
    id: r.id,
    handleId: r.handle.id,
    counterparty: r.grantedBy,
    operator: r.handle.operator,
    timestamp: Number(r.blockTimestamp),
    txHash: r.transactionHash,
    isPubliclyDecryptable: r.handle.isPubliclyDecryptable,
  }));
}

function mapMyGrants(roles: SubgraphHandleRole[]): DelegatedViewEntry[] {
  return roles.map((r) => ({
    id: r.id,
    handleId: r.handle.id,
    counterparty: r.account,
    operator: r.handle.operator,
    timestamp: Number(r.blockTimestamp),
    txHash: r.transactionHash,
    isPubliclyDecryptable: r.handle.isPubliclyDecryptable,
  }));
}

export function useDelegatedView() {
  const { address } = useAccount();

  const shared = useQuery({
    queryKey: ["delegated-view-shared", address],
    queryFn: () => fetchSharedWithMe(address!),
    enabled: !!address,
    refetchInterval: 30_000,
    select: mapSharedWithMe,
  });

  const grants = useQuery({
    queryKey: ["delegated-view-grants", address],
    queryFn: () => fetchMyGrants(address!),
    enabled: !!address,
    refetchInterval: 30_000,
    select: mapMyGrants,
  });

  return {
    sharedWithMe: shared.data ?? [],
    myGrants: grants.data ?? [],
    isLoading: shared.isLoading || grants.isLoading,
    error:
      shared.error?.message ?? grants.error?.message ?? null,
    refetch: () => {
      shared.refetch();
      grants.refetch();
    },
  };
}
