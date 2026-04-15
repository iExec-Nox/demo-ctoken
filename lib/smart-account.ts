import { createPublicClient, http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { CONFIG } from "@/lib/config";

/** Public client via Tenderly — used for on-chain reads (no rate limits on getLogs) */
export function createTenderlyPublicClient() {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: http(CONFIG.rpc.arbitrumSepolia),
  });
}
