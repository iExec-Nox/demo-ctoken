# Privacy by Convergence (ELI5)

> **TL;DR** — Instead of betting on a single privacy technology, Nox combines four: TEEs for fast computation, threshold cryptography for key distribution, MPC for collaborative secrets, and ZK proofs for on-chain verification. Each covers the others' weaknesses.

---

## The Security Guard Team Analogy

Imagine protecting a building. You could hire **one type of guard**:

- **Cameras only** (TEE) — great visual coverage, but vulnerable if someone cuts the power
- **Locks only** (cryptography) — strong access control, but slow if people need to move fast
- **Multiple guards** (MPC) — no single guard knows everything, but they need to coordinate
- **ID badges** (ZK proofs) — prove you belong without revealing personal info, but manufacturing badges is expensive

No single system is perfect. But **all four together**? Now you have cameras watching the halls, locks on every door, guards verifying each other, and ID badges proving identity. An attacker would need to defeat all four simultaneously.

That's **privacy by convergence**.

---

## The Four Technologies

### 1. TEE (Trusted Execution Environments) — The Workhorse

**Role in Nox:** Runs the computation engine (Runner), key management (KMS), data storage (Handle Gateway), and event monitoring (Ingestor).

**Strength:** Fast. A TEE processes encrypted data nearly as fast as plaintext, because it decrypts in hardware-isolated memory, computes normally, and re-encrypts.

**Weakness:** Relies on hardware manufacturer (Intel) trust. If a hardware vulnerability is discovered, TEEs alone aren't sufficient.

**Where it's used today:** Everything off-chain.

### 2. Threshold Cryptography — The Key Distributor

**Role in Nox:** Splits the master private key across multiple KMS nodes so no single node holds the full key.

**Strength:** Eliminates single points of failure. Even if an attacker compromises some nodes, they can't reconstruct the key without reaching the threshold.

**Weakness:** Requires coordination between nodes for every decryption operation. Adds latency and complexity.

**Where it's used:** KMS (target architecture — currently single-node MVP).

### 3. MPC (Multi-Party Computation) — The Collaborator

**Role in Nox:** Enables multiple KMS nodes to jointly compute operations without any single node knowing the full input.

**Strength:** Even during computation, no participant sees the complete picture. Combined with threshold crypto, it means the master key never exists in one place, not even during use.

**Weakness:** High communication overhead between parties. Slower than TEE-based computation.

**Where it's used:** KMS operations (target architecture).

### 4. ZK Proofs (Zero-Knowledge Proofs) — The Verifier

**Role in Nox:** Gas-efficient on-chain verification of off-chain computations.

**Strength:** Proves something is true without revealing the underlying data. Can verify complex computations with a tiny on-chain proof.

**Weakness:** Generating proofs is computationally expensive (slow and resource-intensive).

**Where it's used:** On-chain verification (planned).

---

## How They Complement Each Other

| Weakness of... | ...covered by |
|---|---|
| TEE hardware vulnerability | Threshold crypto (key isn't in one TEE) |
| Threshold crypto latency | TEE speed (computations stay in TEE) |
| MPC communication overhead | TEE (MPC only for key operations, not all computation) |
| ZK proof generation cost | TEE (bulk computation in TEE, ZK only for verification) |
| Single TEE compromise | MPC + threshold (distributed trust) |

The key insight: **no technology needs to be perfect**. Each one only needs to be good at its specific job, and the others cover its blind spots.

---

## The Convergence Matrix

The documentation maps each technology to its role:

| Technology | Where it applies | What it's best at |
|---|---|---|
| **TEE (Intel TDX)** | Runner, Handle Gateway, Ingestor, KMS | Fast computation on encrypted data |
| **Threshold cryptography** | KMS | Distributed key management, no single point of failure |
| **MPC** | KMS | Collaborative computation without reconstructing secrets |
| **ZK Proofs** | On-chain verification | Gas-efficient proof verification without revealing data |

---

## The Evolution Path

```
Phase 1 — TEE Only (Current)
├── All computation in single TEEs
├── Single KMS node
├── Fast and functional
└── Acceptable trust model for testnet

Phase 2 — TEE + Threshold (Next)
├── Computation still in TEEs
├── KMS split across multiple nodes (Shamir's)
├── No single point of failure for key management
└── Production-ready for mainnet

Phase 3 — Full Convergence (Target)
├── TEE for computation
├── Threshold + MPC for key management
├── ZK proofs for on-chain verification
├── Quantum-resistant algorithms
└── Maximum security with minimal trust assumptions
```

---

## Why Not Just Use One Technology?

Each technology alone has a fatal flaw for DeFi:

| Technology alone | Why it's not enough |
|---|---|
| TEE only | Hardware vulnerability = game over. Single manufacturer trust. |
| Threshold crypto only | Too slow for real-time DeFi computation. |
| MPC only | Communication overhead makes it impractical for complex operations. |
| ZK proofs only | Proof generation too expensive for high-frequency operations. |
| FHE (Fully Homomorphic Encryption) | Orders of magnitude too slow for practical DeFi. |

Convergence means the system's security doesn't depend on any single technology being unbreakable. It depends on an **attacker needing to break multiple independent systems simultaneously**.

---

## Key Takeaways

1. **Four technologies, one protocol.** TEE + Threshold Crypto + MPC + ZK Proofs, each applied where it's strongest.

2. **No single point of failure.** If one technology has a weakness, the others compensate.

3. **Pragmatic evolution.** Nox starts with TEEs (fast, practical) and progressively adds layers of distributed trust.

4. **Speed where it matters.** TEEs handle bulk computation. Expensive technologies (MPC, ZK) are reserved for key management and verification.

5. **Future-proof.** The roadmap includes quantum-resistant algorithms, ensuring long-term security even against future threats.

---

*Next in the series: [20 — Permissionless Architecture](./20-permissionless-architecture.md)*
