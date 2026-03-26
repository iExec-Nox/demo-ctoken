# KMS & Threshold Cryptography (ELI5)

> **TL;DR** — The KMS holds the protocol's master key. Today it's a single node. Tomorrow, the key will be split into pieces across multiple nodes using Shamir's Secret Sharing — so no single node can compromise the system, even if hacked.

---

## The Treasure Map Analogy

Imagine a pirate treasure map torn into 5 pieces, with a rule: **you need at least 3 pieces to find the treasure**.

- If you steal 1 piece → useless. You can't reconstruct the map.
- If you steal 2 pieces → still useless. Not enough.
- If you gather 3 pieces → you can reconstruct the full map and find the treasure.

That's **threshold cryptography**. The "treasure" is the protocol's master private key. Each "piece" is a **key share** held by a different KMS node. You need at least `t` shares (the threshold) out of `n` total to do anything useful.

---

## Today: Single KMS

The current MVP runs a **single KMS node** that holds the full private key:

```
┌─────────────────┐
│    KMS Node      │
│                  │
│  privkey_KMS     │  ← single point of failure
│  (full key)      │
│                  │
│  Inside TDX TEE  │
└─────────────────┘
```

This works because:
- The key is inside a **TEE** (Intel TDX) — even the server operator can't read it
- **Remote attestation** proves the correct code is running

But it's still a **single point of failure**. If that one node goes down, or if Intel TDX has an undiscovered vulnerability, the system is at risk.

---

## Tomorrow: Threshold KMS

The target architecture splits the private key across multiple independent nodes:

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ KMS Node │   │ KMS Node │   │ KMS Node │   │ KMS Node │   │ KMS Node │
│    #1    │   │    #2    │   │    #3    │   │    #4    │   │    #5    │
│          │   │          │   │          │   │          │   │          │
│ share_1  │   │ share_2  │   │ share_3  │   │ share_4  │   │ share_5  │
│          │   │          │   │          │   │          │   │          │
│   TDX    │   │   TDX    │   │   TDX    │   │   TDX    │   │   TDX    │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘

                    n = 5 nodes, t = 3 threshold
               (need any 3 of 5 to perform operations)
```

---

## How Shamir's Secret Sharing Works

### The Math (Simplified)

1. Start with a secret number: the private key `S`
2. Create a random polynomial of degree `t-1` where `P(0) = S`
   - For t=3: `P(x) = S + a₁x + a₂x²` (random coefficients `a₁`, `a₂`)
3. Give each node its point on the polynomial:
   - Node 1 gets `share_1 = P(1)`
   - Node 2 gets `share_2 = P(2)`
   - Node 3 gets `share_3 = P(3)`
   - ... and so on

### Why It's Secure

- With **fewer than t shares**, you can't reconstruct `P(0)`. Mathematically impossible — there are infinitely many polynomials that pass through fewer than `t` points.
- With **t or more shares**, you can uniquely reconstruct the polynomial using **Lagrange interpolation** and recover `P(0) = S`.

### The Clever Part

In practice, the private key is **never reconstructed**. Instead, each node computes a **partial result** using its share, and the client combines the partial results:

```
Decryption delegation (threshold version):

1. User sends ephemeral public key K to all KMS nodes
2. Each node i computes: partial_i = K * share_i
3. User collects t partial results
4. User combines: shared_secret = Σ λ_i * partial_i
   (where λ_i are Lagrange coefficients)
5. This equals K * privkey_KMS — the same result as a single-node KMS
```

The private key `privkey_KMS` never exists in one place. It's distributed across nodes and used without ever being assembled.

---

## Security Properties

| Threat | Single KMS | Threshold KMS |
|---|---|---|
| One node compromised | Game over — attacker has the key | Useless — one share reveals nothing |
| One node goes down | Service disrupted | Other nodes continue (if ≥ t remain) |
| Colluding operators | One bad operator = full access | Need t bad operators to collude |
| Hardware vulnerability | Single point of failure | Would need to exploit t independent machines |

---

## Key Rotation

The threshold architecture also enables **key rotation** — refreshing the shares without changing the master key:

1. Nodes collaboratively generate **new shares** for the same polynomial
2. Old shares are discarded
3. The master key `P(0)` stays the same — no need to re-encrypt all stored data
4. Any compromised old share becomes useless

This can happen periodically without any service interruption.

---

## The Path from MVP to Production

```
Phase 1 (Current): Single KMS node
  ├── Full key in one TEE
  ├── Acceptable for testnet/MVP
  └── TEE provides baseline security

Phase 2 (Target): Threshold KMS
  ├── Key split across n nodes (e.g., 5-7)
  ├── Threshold t (e.g., 3-5)
  ├── No single point of failure
  ├── Key rotation support
  └── Production-grade for mainnet

Phase 3 (Future): Quantum-resistant
  ├── Migration to post-quantum algorithms
  └── Long-term security against quantum computers
```

---

## Key Takeaways

1. **The KMS holds the protocol's master key** — the most sensitive component in Nox.

2. **Today: single node in a TEE.** Secure enough for testnet, but a single point of failure.

3. **Tomorrow: Shamir's Secret Sharing** splits the key across multiple nodes. Need t-of-n nodes to operate. No single node can compromise the system.

4. **The key is never reconstructed.** Each node computes a partial result; the client combines them. The full key never exists in one place.

5. **Key rotation** allows refreshing shares without changing the master key or re-encrypting data.

---

*Next in the series: [17 — The Ingestor & NATS Pipeline](./17-ingestor-and-nats.md)*
