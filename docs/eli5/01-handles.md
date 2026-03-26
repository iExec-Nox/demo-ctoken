# What Are Handles? (ELI5)

> **TL;DR** — A handle is like a coat-check ticket. You hand over your secret data, and you get back a small ticket (32 bytes). The ticket says nothing about your data, but when you show it to the right person, you get your data back.

---

## The Problem

Blockchains are public by design. Every transaction, every balance, every state variable — anyone can read it. That's great for transparency, but terrible for privacy.

So what if you want to store a secret number on-chain — say, your token balance — without anyone being able to read it?

You might think: "Just encrypt it and put the ciphertext on-chain." But that creates new problems:

- **Ciphertexts are huge.** Storing them on-chain is expensive (gas costs).
- **You can't compute on ciphertext directly** in the EVM.
- **Every operation changes the ciphertext**, so you'd be constantly writing large blobs to storage.

Nox takes a different approach: **don't put the secret on-chain at all.** Instead, put a tiny reference to it — a **handle**.

---

## The Coat-Check Analogy

Imagine you walk into a fancy restaurant with your winter coat.

1. You hand your coat to the **coat-check attendant** (the Handle Gateway).
2. The attendant stores your coat in a **secure back room** (encrypted storage, AWS S3).
3. They give you a small **numbered ticket** (the handle).

Now:

- The ticket is just a number. Looking at it tells you **nothing** about the coat — not its color, not its brand, nothing.
- The ticket is tiny. It fits in your pocket (32 bytes on-chain).
- When you want your coat back, you show the ticket + **your ID** (your wallet signature). The attendant checks the list (the ACL), confirms you're the owner, and hands your coat back.
- You can even tell the attendant: "My friend Alice can also pick up my coat" — that's **adding a viewer** to the ACL.

In Nox:

| Restaurant analogy | Nox equivalent |
|---|---|
| Your coat | Your secret data (e.g., a balance of 1000 cUSDC) |
| The coat-check attendant | The Handle Gateway |
| The secure back room | Encrypted storage (S3), encrypted with the KMS public key |
| The numbered ticket | A **handle** (32 bytes, stored on-chain) |
| Showing your ID to get the coat back | Signing an EIP-712 message to decrypt |
| "My friend Alice can pick it up too" | `addViewer(handle, aliceAddress)` |

---

## What a Handle Actually Is

A handle is a **32-byte identifier** (`bytes32` in Solidity). That's it. It's not encrypted data. It's not a hash of your data. It's a **pointer** — a reference that the protocol uses to locate and retrieve the actual encrypted value stored off-chain.

In Solidity, you never work with `uint256` for secret values. Instead, you use **encrypted types**:

```solidity
// Regular (public) balance — anyone can read this
uint256 public balance;

// Confidential balance — only a handle is stored on-chain
euint256 private balance;  // this is a bytes32 under the hood
```

When you do math on encrypted values, the result is a new handle:

```solidity
// This doesn't add numbers on-chain.
// It emits an event, and the off-chain Runner computes the result later.
euint256 newBalance = Nox.add(balance, depositAmount);
```

The actual addition happens **off-chain**, inside a secure enclave (Intel TDX). The smart contract only ever sees handles.

---

## The 32-Byte Anatomy

Every handle follows a precise structure:

```
 Byte:  0                        25  26      29  30    31
        ┌────────────────────────┬───────────┬──────┬─────────┐
        │      Prehandle         │  Chain ID │ Type │ Version │
        │      (26 bytes)        │ (4 bytes) │(1 B) │  (1 B)  │
        └────────────────────────┴───────────┴──────┴─────────┘
```

Each segment has a purpose:

| Segment | Size | What it does |
|---|---|---|
| **Prehandle** | 26 bytes | The unique "fingerprint" of this handle |
| **Chain ID** | 4 bytes | Which blockchain this handle belongs to (e.g., `421614` = Arbitrum Sepolia) |
| **Type** | 1 byte | What Solidity type it encodes (`euint256`, `ebool`, `eaddress`, etc.) |
| **Version** | 1 byte | Protocol version (currently `0x00`) |

The **Chain ID** prevents a handle from one chain being replayed on another. The **Type** byte lets the protocol verify type compatibility without decrypting anything — if you try to add a `euint256` and an `ebool`, the contract rejects it immediately.

---

## Deterministic vs. Random

Not all handles are born the same way.

### Computation handles (deterministic)

When a smart contract calls `Nox.add(a, b)`, the resulting handle is **computed deterministically**:

```
prehandle = keccak256(
    operator,        // "add"
    input handles,   // a, b
    contract address,
    caller address,
    block timestamp,
    output index
)
```

Same inputs, same context = same handle. Every time. This means the on-chain contract can compute the result handle **immediately**, without waiting for the off-chain Runner. The Runner later fills in the actual encrypted value behind that handle.

### User-input handles (random)

When a user encrypts a value via the JS SDK and sends it to a contract, the handle is generated **randomly** by the Handle Gateway. Since there's no on-chain formula that produced it, the contract needs **proof** that this handle is legitimate — an EIP-712 signed proof (`HandleProof`) that the Handle Gateway provides.

| | Computation handle | User-input handle |
|---|---|---|
| **Created by** | Smart contract (on-chain) | Handle Gateway (off-chain) |
| **Prehandle** | `keccak256(operator, inputs, ...)` | Random |
| **Needs proof?** | No (deterministic) | Yes (EIP-712 `HandleProof`) |
| **Example** | `Nox.add(a, b)` | `handleClient.encryptInput(1000)` |

---

## Handles in Action

Let's walk through a real scenario — wrapping 100 USDC into confidential cUSDC:

```
Step 1: ENCRYPT
   You (via JS SDK) → Handle Gateway
   "I want to encrypt the value 100"
   ← Handle Gateway returns: handle_100 + proof

Step 2: SUBMIT
   You → Smart Contract
   "wrap(handle_100, proof)"
   The contract verifies the proof, then calls:
     Nox.add(myBalance, handle_100)
   This emits an event and returns handle_newBalance

Step 3: COMPUTE (off-chain)
   Ingestor detects the event → Runner picks it up
   Runner decrypts handle_100 and myBalance inside the TEE
   Runner computes: 0 + 100 = 100
   Runner encrypts the result → stores it behind handle_newBalance

Step 4: DECRYPT (when you want to check your balance)
   You → Handle Gateway
   "I want to decrypt handle_newBalance" + your EIP-712 signature
   Handle Gateway checks the ACL → you're authorized
   KMS delegates decryption material → you decrypt locally
   Result: 100
```

At no point was the value `100` visible on-chain. The blockchain only ever saw `handle_100` and `handle_newBalance` — two opaque 32-byte values.

---

## Key Takeaways

1. **A handle is a pointer, not data.** It's 32 bytes that reference an encrypted value stored off-chain. The blockchain never sees the actual secret.

2. **Handles are tiny and cheap.** Storing 32 bytes on-chain costs very little gas, compared to storing full ciphertext.

3. **Computation produces new handles.** Every `Nox.add()`, `Nox.sub()`, or `Nox.transfer()` creates a new handle. The actual math happens off-chain in a secure enclave.

4. **Access is controlled per-handle.** Each handle has its own ACL. You choose who can decrypt (viewers) and who can use it in computations (admins).

5. **Handles are ephemeral after operations.** Your balance handle changes after every transaction (wrap, transfer, etc.). If you granted someone viewer access to your old handle, they can't see your new balance — you'd need to grant access again.

---

*Next in the series: [02 — Confidentiality vs. Anonymity](./02-confidentiality-vs-anonymity.md)*
