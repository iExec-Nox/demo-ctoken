import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { entryPoint06Address } from "viem/account-abstraction";
import { toLightSmartAccount } from "permissionless/accounts";
import { CONFIG } from "@/lib/config";

/** Alchemy RPC URL — used for bundler/paymaster (requires Alchemy API key) */
export const ALCHEMY_RPC_URL = `https://arb-sepolia.g.alchemy.com/v2/${CONFIG.alchemy.apiKey}`;

/** Public client via Alchemy — used for smart account creation and bundler */
export function createAlchemyPublicClient() {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(ALCHEMY_RPC_URL),
  });
}

/** Public client via Tenderly — used for on-chain reads (no rate limits on getLogs) */
export function createTenderlyPublicClient() {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(CONFIG.rpc.arbitrumSepolia),
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
