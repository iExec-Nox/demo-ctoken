import { GraphQLClient, gql } from "graphql-request";
import { SUBGRAPH_URL } from "@/lib/config";

const client = new GraphQLClient(SUBGRAPH_URL);

// ── Types ──────────────────────────────────────────────────────────

export interface SubgraphHandle {
  id: string;
  operator: string;
  isPubliclyDecryptable: boolean;
  blockTimestamp: string;
  transactionHash: string;
}

export interface SubgraphHandleRole {
  id: string;
  handle: SubgraphHandle;
  account: string;
  role: string;
  grantedBy: string;
  blockTimestamp: string;
  transactionHash: string;
}

// ── Queries ────────────────────────────────────────────────────────

const SHARED_WITH_ME_QUERY = gql`
  query SharedWithMe($user: String!) {
    handleRoles(
      where: { account: $user, role: VIEWER }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 1000
    ) {
      id
      handle {
        id
        operator
        isPubliclyDecryptable
        blockTimestamp
        transactionHash
      }
      account
      role
      grantedBy
      blockTimestamp
      transactionHash
    }
  }
`;

const MY_GRANTS_QUERY = gql`
  query MyGrants($user: String!) {
    handleRoles(
      where: { grantedBy: $user, role: VIEWER }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 1000
    ) {
      id
      handle {
        id
        operator
        isPubliclyDecryptable
        blockTimestamp
        transactionHash
      }
      account
      role
      grantedBy
      blockTimestamp
      transactionHash
    }
  }
`;

// ── Fetch functions ────────────────────────────────────────────────

interface HandleRolesResponse {
  handleRoles: SubgraphHandleRole[];
}

export async function fetchSharedWithMe(
  address: string,
): Promise<SubgraphHandleRole[]> {
  const data = await client.request<HandleRolesResponse>(
    SHARED_WITH_ME_QUERY,
    { user: address.toLowerCase() },
  );
  return data.handleRoles;
}

export async function fetchMyGrants(
  address: string,
): Promise<SubgraphHandleRole[]> {
  const data = await client.request<HandleRolesResponse>(MY_GRANTS_QUERY, {
    user: address.toLowerCase(),
  });
  return data.handleRoles;
}
