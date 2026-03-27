# EIP-712 Signatures in Nox (ELI5)

> **TL;DR** — EIP-712 is a standard for signing structured data with your Ethereum wallet. In Nox, it's used in two critical places: proving that an encrypted input is legitimate (input proofs), and proving your identity when you want to decrypt a value (decryption requests). Both are gasless — just a wallet popup, no transaction.

---

## The Notarized Letter Analogy

Imagine you need to send an important document. You have two options:

| Method | Cost | Proof | Equivalent |
|---|---|---|---|
| **Send it by registered mail** | Postage fee | The post office records it in their system | An on-chain transaction (costs gas) |
| **Get it notarized** | Free (you just sign) | The notary stamp proves you signed it, when, and what it says | An EIP-712 signature (gasless) |

A notarized document is legally binding without going through the postal system. An EIP-712 signature is cryptographically binding without going through the blockchain.

---

## What Is EIP-712?

EIP-712 is an Ethereum standard for signing **structured, human-readable data** with your wallet.

### Before EIP-712

Signing raw data looked like this in your wallet:

```
Sign this message?

0x7f4e3a2b9c1d8f0e5a6b3c4d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f
```

Useless. You have no idea what you're signing. Could be anything — a transfer, a permission, a scam.

### With EIP-712

The same signature request looks like this:

```
Sign this message?

🔒 Nox Protocol — Decrypt Request
  Handle: 0x7f4e...5e6f
  Contract: 0x9923...C963 (Confidential RLC)
  Chain: Arbitrum Sepolia (421614)
```

You can **read and understand** what you're agreeing to. The data is structured with named fields and types, not a raw hex blob.

---

## Where Nox Uses EIP-712

### Use Case 1: Input Proofs (Encryption)

When you encrypt a value via the SDK, the Handle Gateway signs an EIP-712 proof that says: "This handle was created by me, for this contract, on this chain."

```
The flow:

1. You encrypt 100 cUSDC via the SDK
   └── SDK sends 100 to Handle Gateway

2. Handle Gateway encrypts, creates handle, then signs:
   ┌─────────────────────────────────────┐
   │  EIP-712 Input Proof                │
   │                                     │
   │  handle:   0xABC...                 │
   │  contract: 0x9923... (cRLC)         │
   │  sender:   0xC0da... (your address) │
   │  chainId:  421614                   │
   └─────────────────────────────────────┘
   Signed by: Handle Gateway's attestation key

3. You submit (handle + proof) to the smart contract

4. NoxCompute verifies:
   - Is this signature from the registered Handle Gateway? ✓
   - Does the contract address match? ✓
   - Does the chain ID match? ✓
   - Is the sender the actual caller? ✓
   → Handle accepted as a valid input
```

**Why this matters:** Without the proof, anyone could submit a fake handle pointing to garbage data. The EIP-712 signature guarantees the handle was created by the legitimate Handle Gateway in a TEE.

### Use Case 2: Decryption Requests

When you want to read your balance, you sign an EIP-712 message to prove your identity — without paying gas:

```
The flow:

1. Your browser builds the message:
   ┌──────────────────────────────────────┐
   │  EIP-712 Decrypt Request             │
   │                                      │
   │  handle:    0xABC...                 │
   │  publicKey: (your ephemeral RSA key) │
   │  chainId:   421614                   │
   └──────────────────────────────────────┘

2. Your wallet shows a popup:
   "Sign this decrypt request for handle 0xABC... ?"
   → You click "Sign" (no gas, no transaction)

3. Handle Gateway receives:
   - The EIP-712 message
   - Your wallet signature
   - Your RSA public key

4. Handle Gateway verifies:
   - Recover signer address from signature → 0xC0da...
   - Check on-chain ACL: isViewer(0xABC..., 0xC0da...)? ✓
   - Proceed to decryption delegation with KMS
```

**Why this matters:** The signature proves you own the wallet address. No gas needed — just a popup in MetaMask. You can check your balance 100 times without paying anything.

---

## Why Not Just Use Regular Signatures?

Ethereum wallets can sign arbitrary messages (`personal_sign`). Why use EIP-712 specifically?

| Feature | `personal_sign` | EIP-712 |
|---|---|---|
| **Readability** | Raw hex — you can't tell what you're signing | Structured fields — you see exactly what you're signing |
| **Replay protection** | None built-in — the same signature could be reused on another chain | Chain ID and contract address baked into the structure |
| **Type safety** | Just bytes | Typed fields (uint256, address, bytes32) |
| **Phishing resistance** | Easy to trick users into signing something malicious | Users can read and verify the content before signing |

### The Replay Attack

Without chain ID in the signature, an attacker could:

1. Capture your decrypt signature on Arbitrum Sepolia
2. Replay it on mainnet (if the same handle existed)
3. Decrypt your data without your consent

EIP-712 prevents this because the chain ID is part of the signed data. A signature for chain `421614` is invalid on chain `1`.

### The Contract Binding

Input proofs include the contract address. This prevents:

1. Creating a valid handle for contract A (legit cToken)
2. Submitting it to contract B (malicious contract)

The proof is only valid for the specific contract it was created for.

---

## The Two EIP-712 Signers in Nox

| Signer | Signs what | Verified by | Purpose |
|---|---|---|---|
| **Handle Gateway** | Input proofs (handle + contract + chain) | NoxCompute smart contract (on-chain) | Proves the handle is legitimate |
| **User's wallet** | Decrypt requests (handle + RSA key + chain) | Handle Gateway (off-chain) | Proves the user's identity for ACL check |

```
INPUT FLOW:
  Handle Gateway signs ──> NoxCompute verifies on-chain
  "This handle is real"

DECRYPT FLOW:
  User's wallet signs ──> Handle Gateway verifies off-chain
  "I am the owner / an authorized viewer"
```

---

## What Makes a Valid EIP-712 Message

Every EIP-712 message in Nox has a **domain separator** that binds it to a specific context:

```
EIP-712 Domain:
  name:              "NoxCompute"
  version:           "1"
  chainId:           421614 (Arbitrum Sepolia)
  verifyingContract:  0x5633...eA6 (NoxCompute address)
```

This means:
- A signature from Ethereum mainnet won't work on Arbitrum Sepolia (different `chainId`)
- A signature for contract A won't work on contract B (different `verifyingContract`)
- A signature for protocol version 1 won't work on version 2 (different `version`)

It's like a notarized letter that specifies the exact court, jurisdiction, and case number — it can't be reused anywhere else.

---

## For the Curious: What the User Sees

When your Nox dApp triggers a decryption, MetaMask shows something like:

```
┌─────────────────────────────────────┐
│  Signature Request                  │
│                                     │
│  NoxCompute wants you to sign:      │
│                                     │
│  Action: Decrypt                    │
│  Handle: 0x7f4e3a...c4d5e6f        │
│  Chain: Arbitrum Sepolia            │
│                                     │
│  [Sign]              [Reject]       │
└─────────────────────────────────────┘
```

No gas fee. No transaction. No ETH needed. Just your confirmation that you want to decrypt this specific handle.

---

## Key Takeaways

1. **EIP-712 is structured, readable signing.** Users see what they're signing — not a raw hex blob. This prevents phishing and accidental approvals.

2. **Two uses in Nox**: input proofs (Handle Gateway signs to certify a handle) and decrypt requests (user signs to prove identity). Both are gasless.

3. **Built-in replay protection.** Chain ID and contract address are part of the signed data — signatures can't be reused across chains or contracts.

4. **Decryption is free.** Since it only requires an EIP-712 signature (not an on-chain transaction), checking your confidential balance costs zero gas.

5. **Two different signers.** The Handle Gateway signs input proofs (verified on-chain). The user signs decrypt requests (verified off-chain by the Handle Gateway).

---

*Next in the series: [24 — Nox vs. Alternatives](./24-nox-vs-alternatives.md)*
