# Nox vs. Alternatives (ELI5)

> **TL;DR** — Several projects tackle on-chain privacy, each with different trade-offs. Nox combines TEE-based computation (fast, flexible) with on-chain ACL (selective disclosure) and plans for MPC + ZK layers. The key differentiator: Nox gives you privacy *and* compliance — not one or the other.

---

## The Landscape at a Glance

Privacy in DeFi isn't new. But the approaches are very different:

| Project | Core Technology | Privacy Model | Selective Disclosure | Chain |
|---|---|---|---|---|
| **Nox (iExec)** | TEE (Intel TDX) + planned MPC/ZK | Encrypted balances & transfers | Yes — built-in ACL | Any EVM (currently Arbitrum Sepolia) |
| **Zama (fhEVM)** | Fully Homomorphic Encryption (FHE) | Encrypted state & computation | Limited (no built-in ACL) | Custom fhEVM chain |
| **Inco** | FHE (based on Zama's fhEVM) | Encrypted state | Limited | Dedicated L1 |
| **Railgun** | Zero-Knowledge Proofs (ZK-SNARKs) | Shielded transaction pool | No — fully opaque | Ethereum, Polygon, Arbitrum |
| **Aztec** | ZK-SNARKs (custom ZK-rollup) | Private execution environment | Partial (programmable) | Aztec L2 (not EVM) |

---

## The Four Approaches Explained

### 1. TEE-Based (Nox)

**How it works:** Encrypted data is sent to a hardware-isolated enclave (Intel TDX). Inside the enclave, data is decrypted, computed on, and re-encrypted. The result goes back on-chain as a new encrypted handle.

**The coffee shop analogy:** You write your order on a sealed envelope. The barista takes it into a locked room with no windows, reads it, makes your coffee, and hands it back through a slot. They never speak your order aloud.

| Strengths | Limitations |
|---|---|
| Fast — millisecond computations | Trust in hardware manufacturer (Intel) |
| No math limitations — anything you can write in Solidity | TEE vulnerabilities are rare but possible |
| Standard Solidity — no new language to learn | Currently single Runner (scaling planned) |
| Selective disclosure built-in via ACL | |
| Works on any EVM chain | |

### 2. FHE-Based (Zama, Inco)

**How it works:** Fully Homomorphic Encryption lets you compute directly on encrypted data *without ever decrypting it*. The math happens on ciphertext — additions and multiplications are done on the encrypted numbers themselves.

**The coffee shop analogy:** You give the barista your order in a language they don't understand. Somehow, through a magical process, they produce the right coffee — without ever understanding what you asked for.

| Strengths | Limitations |
|---|---|
| No hardware trust assumption — pure math | Very slow — orders of magnitude slower than plaintext operations |
| Strong theoretical guarantees | Limited operations — not all Solidity math is possible efficiently |
| No side-channel risk | Large ciphertext sizes — expensive on-chain storage |
| | Requires custom chain or modified EVM |
| | No built-in selective disclosure mechanism |

**The speed issue is real:** A simple addition on encrypted numbers with FHE can take seconds to minutes, versus milliseconds with TEE. For DeFi operations that need to feel instant, this matters.

### 3. ZK-Based (Railgun, Aztec)

**How it works:** Zero-Knowledge Proofs let you prove something is true without revealing the underlying data. Railgun uses a shielded pool where tokens are mixed — you deposit public tokens, transact privately inside the pool, and withdraw later.

**The coffee shop analogy:** You put money in a vending machine. Coffee comes out. Nobody knows which button you pressed or how much change you got — they just see someone used the machine.

| Strengths | Limitations |
|---|---|
| Strong mathematical privacy guarantees | No selective disclosure — all or nothing opacity |
| Battle-tested cryptography | Mixing pools can have regulatory issues (see Tornado Cash) |
| Works on existing chains (Railgun) | Limited composability with other DeFi protocols |
| | Complex developer experience (Aztec uses Noir, not Solidity) |

**The compliance problem:** Railgun-style privacy is excellent for individual users, but institutions can't use it. There's no way to let a regulator see your balance without exposing everything. You're either fully private or fully public — no middle ground.

### 4. Custom L2 / Execution Environment (Aztec)

**How it works:** Aztec builds an entirely new execution layer where transactions are private by default, using ZK proofs. It's not just a token standard — it's a whole new chain with its own programming language (Noir).

| Strengths | Limitations |
|---|---|
| Privacy at the execution layer — everything is private by default | Not EVM-compatible — can't use Solidity |
| Programmable privacy (can choose what to reveal) | New language (Noir) — steep learning curve |
| Strong ZK guarantees | Separate ecosystem — not composable with existing EVM DeFi |
| | Still in development |

---

## The Key Differentiators

### 1. Selective Disclosure — Nox's Killer Feature

This is the single biggest architectural difference:

```
Railgun:     Private ──────────────────────────── Public
             (fully opaque)                       (fully transparent)
             No middle ground.

Nox:         Private ──── Selective Disclosure ── Public
             (default)    (you choose who sees)   (opt-in)
             ACL-based, per-handle, on-chain.
```

With Nox, a DeFi fund can:
1. Keep all positions encrypted (private by default)
2. Grant a regulator viewer access to specific handles (compliance)
3. The market sees nothing (competitive advantage preserved)

With Railgun, the fund would have to choose: fully private (can't comply) or fully public (no advantage). There's no "show the regulator, hide from the market."

**Why this matters for adoption:** MiCA (EU), SEC rules, and similar regulations require auditability. A privacy solution without selective disclosure is a non-starter for institutions.

### 2. Any EVM Chain vs. Custom Chains

| Approach | Where it works |
|---|---|
| **Nox** | Any EVM chain (currently Arbitrum Sepolia, targeting multi-chain) |
| **Zama fhEVM** | Only on fhEVM-compatible chains |
| **Inco** | Only on Inco L1 |
| **Aztec** | Only on Aztec L2 |
| **Railgun** | EVM chains (Ethereum, Polygon, Arbitrum) |

Nox and Railgun are the only ones that work on existing EVM chains. But Railgun is a mixing pool (limited composability), while Nox provides encrypted state at the token level (composable with any DeFi contract).

### 3. Developer Experience

| | Nox | Zama | Inco | Railgun | Aztec |
|---|---|---|---|---|---|
| **Language** | Standard Solidity | Modified Solidity (TFHE types) | Modified Solidity | N/A (user-facing) | Noir (custom) |
| **Learning curve** | Low — familiar types + Nox library | Medium — new types (euint, ebool) | Medium | N/A | High — new paradigm |
| **Token standard** | ERC-7984 (ERC-20 compatible interface) | Custom encrypted ERC-20 | Custom | Shielded pool (not a token standard) | Private token (Noir) |
| **Integration effort** | Wrap existing ERC-20 or build native | Build from scratch on fhEVM | Build from scratch on Inco | User deposits into pool | Build from scratch in Noir |

### 4. Speed

This is where the technology choice has the most visible impact:

| Operation | Nox (TEE) | Zama/Inco (FHE) | Railgun (ZK) |
|---|---|---|---|
| Encrypted addition | ~milliseconds | ~seconds | N/A (proof generation: seconds) |
| Encrypted transfer | ~seconds (end-to-end) | ~tens of seconds | ~seconds (proof generation) |
| Balance check (decrypt) | ~milliseconds (gasless) | ~seconds | N/A (shielded balance is local) |

TEE-based computation is fundamentally faster because it decrypts, computes in plaintext, and re-encrypts — rather than computing on ciphertext (FHE) or generating mathematical proofs (ZK).

---

## The Trade-Off Summary

Every approach makes a different trade-off:

| | Privacy Strength | Speed | Composability | Selective Disclosure | Trust Assumption |
|---|---|---|---|---|---|
| **Nox** | High | Fast | High (any EVM) | Yes (built-in ACL) | Hardware (Intel TDX) |
| **Zama/Inco** | Very high | Slow | Low (custom chain) | No | Math only (no hardware) |
| **Railgun** | Very high | Medium | Low (pool-based) | No | Math only (ZK proofs) |
| **Aztec** | Very high | Medium | Low (custom L2) | Partial | Math only (ZK proofs) |

**Nox's bet:** TEE + MPC + ZK is a better combination than any single technology alone. TEE gives you speed and flexibility today. MPC removes single points of failure for key management. ZK will add verifiable correctness and reduce on-chain storage costs.

---

## When to Choose What

| Use case | Best fit | Why |
|---|---|---|
| DeFi fund with regulatory requirements | **Nox** | Selective disclosure + speed + composability |
| Confidential token for existing ERC-20 | **Nox** | Wrap any ERC-20 into ERC-7984, deploy on existing chain |
| Maximum theoretical privacy, speed doesn't matter | **Zama/Inco** | FHE has no hardware trust assumption |
| Individual user wants private transfers | **Railgun** | Simple UX, battle-tested, no integration needed |
| Building a new private-by-default application from scratch | **Aztec** | Full-stack private execution environment |
| Institutional DeFi, RWA tokenization | **Nox** | Only solution with built-in compliance via selective disclosure |

---

## Key Takeaways

1. **No single technology solves everything.** TEE is fast but trusts hardware. FHE is trustless but slow. ZK is proven but lacks selective disclosure. The right answer depends on the use case.

2. **Selective disclosure is Nox's key differentiator.** The on-chain ACL lets users grant view access to specific parties — bridging the gap between privacy and compliance that no other solution addresses natively.

3. **EVM compatibility matters.** Nox works on any EVM chain with existing DeFi liquidity. Solutions that require custom chains fragment the ecosystem.

4. **Speed is a UX concern, not just a technical one.** DeFi users expect sub-second interactions. TEE delivers that today; FHE does not yet.

5. **The long-term vision is convergence.** Nox plans to layer TEE (speed) + MPC (distributed trust) + ZK (verifiable correctness) — using each technology where it excels rather than betting on one.

---

*Next in the series: [25 — RWA Token Standards & Nox](./25-rwa-token-standards.md)*
