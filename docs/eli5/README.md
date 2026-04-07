# Nox Protocol — Explain Like I'm 5

A series of beginner-friendly explanations for the core concepts behind the Nox confidential computing protocol. Each article uses simple analogies and plain English to make complex cryptographic ideas accessible.

## Articles

### Foundations

| # | Topic | Description |
|---|---|---|
| 01 | [Handles](./01-handles.md) | What are handles and why does Nox use 32-byte pointers instead of putting encrypted data on-chain? |
| 02 | [Confidentiality vs. Anonymity](./02-confidentiality-vs-anonymity.md) | Nox hides *what* you do, not *who* you are — and why that's a feature |
| 03 | [Why DeFi Transparency Is a Problem](./03-why-defi-transparency-is-a-problem.md) | Copy-trading, MEV, institutional reluctance — the pain Nox solves |
| 04 | [TEE (Trusted Execution Environments)](./04-tee.md) | Intel TDX enclaves — the locked room where secret data gets processed |

### How It Works

| # | Topic | Description |
|---|---|---|
| 05 | [The Full Lifecycle](./05-the-full-lifecycle.md) | Input → Compute → Output: the three phases of every confidential operation |
| 06 | [ECIES Encryption](./06-ecies-encryption.md) | How Nox encrypts data so only the protocol can process it |
| 07 | [Decryption Delegation](./07-decryption-delegation.md) | Why the KMS never decrypts — it gives you the tools to do it yourself |

### Access Control

| # | Topic | Description |
|---|---|---|
| 08 | [Access Control Lists (ACL)](./08-acl.md) | Admin, Viewer, Transient, Public — four permission levels for every handle |
| 09 | [Transient vs. Persistent Access](./09-transient-vs-persistent.md) | The temporary pass that expires at the end of a transaction |
| 10 | [Selective Disclosure](./10-selective-disclosure.md) | Let specific people see your private data without making it public |

### Confidential Tokens

| # | Topic | Description |
|---|---|---|
| 11 | [ERC-7984 (Confidential Tokens)](./11-erc-7984.md) | The token standard that works like ERC-20 but with encrypted balances |
| 12 | [Wrap & Unwrap](./12-wrap-and-unwrap.md) | The bridge between public tokens and confidential tokens |
| 13 | [Wrapping Arithmetic](./13-wrapping-arithmetic.md) | Why add/sub don't revert on overflow — and why that protects privacy |
| 14 | [Token Operations (Transfer / Mint / Burn)](./14-token-operations.md) | Atomic operations that handle everything in one shot |

### Architecture Deep-Dives

| # | Topic | Description |
|---|---|---|
| 15 | [The Protocol Architecture](./15-protocol-architecture.md) | The 6 components and how they work together |
| 16 | [KMS & Threshold Cryptography](./16-kms-and-threshold-cryptography.md) | Shamir's Secret Sharing — splitting the master key so no single node can compromise it |
| 17 | [The Ingestor & NATS Pipeline](./17-ingestor-and-nats.md) | How blockchain events get picked up and delivered to the computation engine |
| 18 | [The Runner](./18-the-runner.md) | The only component that ever sees plaintext — inside a locked room, for a brief moment |

### Architecture Deep-Dives (continued)

| # | Topic | Description |
|---|---|---|
| 21 | [The Handle Gateway](./21-handle-gateway.md) | The single front door for all encrypted data — encryption, storage, and decryption coordination |
| 22 | [Remote Attestation & Proof of Cloud](./22-remote-attestation.md) | How you verify a TEE is genuine and running on the right machine — without trusting anyone |
| 23 | [EIP-712 Signatures in Nox](./23-eip712-in-nox.md) | Structured, gasless signatures for input proofs and decryption requests |

### Vision

| # | Topic | Description |
|---|---|---|
| 19 | [Privacy by Convergence](./19-privacy-by-convergence.md) | TEE + Threshold Crypto + MPC + ZK Proofs — why Nox combines four privacy technologies |
| 20 | [Permissionless Architecture](./20-permissionless-architecture.md) | Anyone can run a node, create primitives, and earn rewards — no gatekeepers |
| 24 | [Nox vs. Alternatives](./24-nox-vs-alternatives.md) | Zama, Inco, Railgun, Aztec — how Nox compares and when to choose what |
| 25 | [RWA Token Standards & Nox](./25-rwa-token-standards.md) | ERC-3643, ERC-4626, ERC-7540 — how Nox adds confidentiality to regulated assets and vaults |

### Practical

| # | Topic | Description |
|---|---|---|
| 26 | [The On-Chain Smart Contracts](./26-smart-contracts.md) | ERC-20, cToken (ERC-7984), NoxCompute — the three contract types and their roles in the demo |
| 27 | [NoxCompute Deep Dive](./27-noxcompute-deep-dive.md) | The computation engine — operands, arithmetic primitives, comparisons, why mint/burn live here |
