/**
 * Contract addresses — Arbitrum Sepolia (chainId: 421614)
 *
 * Single source of truth for all deployed contract addresses.
 * Update this file when contracts are redeployed.
 */

export const CONTRACTS = {
  /** Testnet USDC (ERC-20, decimals: 6) */
  USDC: "0xf3C3351D6Bd0098EEb33ca8f830FAf2a141Ea2E1",
  /** Confidential USDC — TODO: replace with deployed cUSDC address */
  cUSDC: "0x...",
  /** iExec RLC (ERC-20, decimals: 9) */
  RLC: "0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963",
  /** Confidential RLC (ERC-7984, decimals: 9) */
  cRLC: "0x271f46e78f2fe59817854dabde47729ac4935765",
  /** NoxCompute proxy — addViewer / isViewer */
  NOX_COMPUTE: "0x5633472D35E18464CA24Ab974954fB3b1B122eA6",
} as const;

/** Null address — used to filter native tokens (ETH) in contract calls */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/** Null handle (bytes32) — indicates an uninitialized confidential balance */
export const ZERO_HANDLE = ("0x" + "0".repeat(64)) as `0x${string}`;
