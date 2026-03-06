/**
 * ABI fragments for the NoxCompute contract (proxy at NOX_COMPUTE_ADDRESS).
 * Selectors confirmed on-chain against the implementation bytecode.
 *
 * - `addViewer(bytes32, address)` — selector 0x10ff39ca
 * - `isViewer(bytes32, address)` — selector 0x02d0e66e
 */

export const NOX_COMPUTE_ADDRESS =
  "0x5633472D35E18464CA24Ab974954fB3b1B122eA6" as const;

export const noxComputeAbi = [
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "viewer", type: "address" },
    ],
    name: "addViewer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "viewer", type: "address" },
    ],
    name: "isViewer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
