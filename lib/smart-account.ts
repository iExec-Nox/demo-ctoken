import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { entryPoint06Address } from "viem/account-abstraction";
import { toLightSmartAccount } from "permissionless/accounts";
import { CONFIG } from "@/lib/config";

/** Alchemy RPC URL for Arbitrum Sepolia — single source of truth */
export const ALCHEMY_RPC_URL = `https://arb-sepolia.g.alchemy.com/v2/${CONFIG.alchemy.apiKey}`;

/** Shared viem public client for on-chain reads (Arbitrum Sepolia via Alchemy) */
export function createAlchemyPublicClient() {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(ALCHEMY_RPC_URL),
  });
}

/**
 * Retrieves the Alchemy signer from the Account Kit store
 * and converts it to a viem LocalAccount.
 *
 * @throws if the signer is not authenticated
 */
export async function getAlchemySigner() {
  const { alchemyConfig } = await import("@/lib/alchemy");
  const signer = alchemyConfig.store.getState().signer;
  if (!signer) throw new Error("Alchemy signer not available — please reconnect");
  return signer;
}

/**
 * Creates a LightSmartAccount (ERC-4337) from the Alchemy embedded signer.
 * The smart account address is deterministic: same signer always gives same address.
 *
 * Used for:
 * - Computing the smart account address (useWalletAuth)
 * - Sending UserOperations via bundler (useWriteTransaction)
 * - Creating handle clients for decrypt (useHandleClient)
 */
export async function createLightAccount() {
  const signer = await getAlchemySigner();
  const owner = signer.toViemAccount();
  const client = createAlchemyPublicClient();

  return toLightSmartAccount({
    client,
    owner,
    version: "1.1.0",
    entryPoint: { address: entryPoint06Address, version: "0.6" },
  });
}
