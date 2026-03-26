# TEE — Trusted Execution Environments (ELI5)

> **TL;DR** — A TEE is a locked room inside a computer's processor where data can be processed without anyone being able to peek — not even the person who owns the computer. Nox uses Intel TDX enclaves to do math on your secret data without ever exposing it.

---

## The Locked Kitchen Analogy

Imagine you have a secret family recipe, and you want a restaurant to cook it for you. But you don't trust the chef not to steal the recipe.

Solution: a **locked kitchen** with the following rules:

1. You slide your recipe and ingredients through a **one-way slot** into the kitchen.
2. The kitchen locks. **Nobody** can open the door, peek through the window, or read the recipe — not even the restaurant owner.
3. The chef inside cooks the dish following the recipe.
4. The finished dish comes out through another one-way slot.

The restaurant owner provided the kitchen and the chef, but they **never saw your recipe or your ingredients**. They only saw a locked room doing its job.

That locked kitchen is a **Trusted Execution Environment**.

---

## What Is a TEE, Technically?

A TEE is a hardware-isolated area inside a processor (CPU) that:

- **Encrypts its own memory** — even if someone physically probes the RAM chips, they see garbage
- **Blocks the operating system** — the OS that runs the machine can't read what's inside
- **Blocks the administrator** — the cloud provider, the sysadmin, even root access can't peek in
- **Provides attestation** — the TEE can cryptographically prove *what code* is running inside it, so you can verify it hasn't been tampered with

### Intel TDX (Trust Domain Extensions)

Nox specifically uses **Intel TDX**, a TEE technology designed for cloud-scale confidential computing. Key properties:

| Property | What it means |
|---|---|
| Hardware isolation | Protected by the CPU itself, not just software |
| Memory encryption | All data in the TEE's memory is encrypted at the hardware level |
| Remote attestation | Anyone can verify that the TEE is running the expected, unmodified code |
| Production-proven | iExec has operated TEE infrastructure since 2017 |

---

## Where Nox Uses TEEs

Almost every off-chain component of the Nox protocol runs inside a TEE:

```
┌──────────────────────────────────────────────────────┐
│                    Intel TDX                         │
│                                                      │
│   ┌──────────┐  ┌────────┐  ┌───────────────────┐   │
│   │  Runner   │  │  KMS   │  │  Handle Gateway   │   │
│   │(computes) │  │(keys)  │  │(stores encrypted  │   │
│   │          │  │        │  │       data)        │   │
│   └──────────┘  └────────┘  └───────────────────┘   │
│                                                      │
│   ┌────────────┐                                     │
│   │  Ingestor  │                                     │
│   │(reads chain│                                     │
│   │  events)   │                                     │
│   └────────────┘                                     │
└──────────────────────────────────────────────────────┘
```

| Component | Why it needs a TEE |
|---|---|
| **Runner** | It decrypts inputs, does the math, and encrypts results. Plaintext only exists in memory, inside the TEE. |
| **KMS** | It holds the protocol's private key. The TEE ensures nobody — not even the operator — can extract it. |
| **Handle Gateway** | It handles encryption/decryption coordination. The TEE protects the process. |
| **Ingestor** | It reads blockchain events. The TEE ensures event data isn't tampered with before reaching NATS. |

---

## The Trust Model

Without TEEs, you'd have to trust the operator: "I promise I won't look at your data." That's a pinky promise — not security.

With TEEs, the trust shifts to **hardware and code**:

| Question | Without TEE | With TEE |
|---|---|---|
| "Can the server admin read my data?" | Yes | **No** — memory is encrypted |
| "Can the cloud provider peek?" | Yes | **No** — isolation is hardware-enforced |
| "How do I know the right code is running?" | You don't | **Remote attestation** proves it cryptographically |
| "What if someone hacks the OS?" | Your data is exposed | **TEE is isolated** from the OS |

---

## Remote Attestation — "Prove It"

This is the magic trick that makes TEEs trustworthy. Here's how it works:

1. The code that runs inside the TEE has a **hash** (a unique fingerprint).
2. That hash is **stored on-chain** in a Registry contract.
3. When a TEE starts up, the hardware generates an **attestation report** — a cryptographic proof saying: "I am a genuine Intel TDX enclave, and the code running inside me has hash `0xABC123...`."
4. Anyone can compare the attested hash to the on-chain Registry. If they match, you know the TEE is running the exact code it claims to.

No trust in the operator needed. Trust the hardware + verify the code.

---

## TEE vs. Other Privacy Technologies

| Technology | How it achieves privacy | Trade-off |
|---|---|---|
| **TEE (Intel TDX)** | Hardware-isolated computation | Fast, but requires trusting hardware manufacturer |
| **Zero-Knowledge Proofs** | Mathematical proof without revealing data | Very secure, but slow and expensive for complex operations |
| **MPC (Multi-Party Computation)** | Multiple parties compute together without sharing inputs | High communication overhead |
| **Homomorphic Encryption** | Compute directly on ciphertext | Extremely slow (orders of magnitude) |

Nox chose TEEs as the primary engine because they offer the best balance of **speed** and **security** for DeFi operations. But the long-term vision (see [article 19](./19-privacy-by-convergence.md)) combines multiple technologies.

---

## Key Takeaways

1. **A TEE is a hardware-locked room** inside a CPU where data can be processed privately. Not even the machine's owner can peek inside.

2. **Intel TDX** is the specific TEE technology Nox uses — battle-tested, cloud-scale, hardware-isolated.

3. **All critical Nox components** (Runner, KMS, Handle Gateway, Ingestor) run inside TEEs. Plaintext data only exists in TEE memory, never on disk, never exposed.

4. **Remote attestation** lets anyone verify that the correct, unmodified code is running inside a TEE — turning "trust me" into "verify me."

5. **TEEs are fast** compared to other privacy technologies (ZK, MPC, FHE), which is why Nox can process DeFi operations at practical speeds.

---

*Next in the series: [05 — The Full Lifecycle](./05-the-full-lifecycle.md)*
