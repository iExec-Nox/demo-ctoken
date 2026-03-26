# ECIES Encryption (ELI5)

> **TL;DR** — ECIES is how Nox encrypts your data so that only the protocol can process it. It's like creating a one-time lock that only the KMS has the key for, but the KMS never actually opens the lock itself — it just tells *you* how to open it.

---

## The Magic Padlock Analogy

Imagine a special kind of padlock:

1. **Anyone can lock it** — the KMS publishes an open padlock (its public key). You snap it shut on your box. Done.
2. **Only one key exists** — the KMS holds the private key that opens it.
3. **But here's the twist**: the KMS never opens your box. Instead, when you need your data back, the KMS gives you a **copy of the key shape**, encrypted so only you can use it. You carve your own key and open the box yourself.

That's ECIES in a nutshell: easy to lock, controlled unlock, and the key holder never sees what's inside.

---

## What Is ECIES?

**ECIES** stands for **Elliptic Curve Integrated Encryption Scheme**. It's a hybrid encryption method that combines:

- **Elliptic curve cryptography** (for securely sharing a secret between two parties)
- **AES-256-GCM** (for actually encrypting the data)

Nox uses ECIES on the **secp256k1** curve — the same curve Ethereum uses for wallet signatures. This isn't a coincidence: it means the protocol's cryptography is compatible with the Ethereum ecosystem.

---

## How It Works, Step by Step

Let's say you want to encrypt the value `1000` to store it in the protocol.

### Step 1: Generate an Ephemeral Key

You (the SDK) generate a random number `k` — this is a one-time secret that will be thrown away after encryption.

From `k`, you compute a public point: `K = k * G` (where `G` is the curve's generator point).

> Think of `k` as a one-time-use combination lock code. `K` is the lock itself, which you'll send along with the encrypted data.

### Step 2: Compute the Shared Secret

Using your ephemeral secret `k` and the KMS's public key, you compute:

```
S = k * pubkey_KMS
```

This is an **ECDH** (Elliptic Curve Diffie-Hellman) shared secret. The magic of elliptic curves means:

- **You** can compute `S` because you know `k` and `pubkey_KMS`
- **The KMS** can compute `S` because it knows `privkey_KMS` and `K` (since `privkey_KMS * K = privkey_KMS * k * G = k * pubkey_KMS = S`)
- **Nobody else** can compute `S` without knowing either `k` or `privkey_KMS`

### Step 3: Derive an AES Key

The shared secret `S` isn't used directly. Instead, it's fed through **HKDF-SHA256** (a key derivation function) to produce a proper AES-256 encryption key:

| Parameter | Value |
|---|---|
| Hash | SHA-256 |
| Input key material | Shared secret `S` (32 bytes) |
| Salt | 32 bytes of zeros |
| Info | `"ECIES:AES_GCM:v1"` |
| Output | 32-byte AES-256 key |

### Step 4: Encrypt

The actual data (`1000`) is encrypted with **AES-256-GCM** using the derived key and a random 12-byte nonce.

### Step 5: Store

The Handle Gateway stores three things alongside the handle:

```
(ciphertext, K, nonce)
```

- `ciphertext` — your encrypted value
- `K` — the ephemeral public key (needed for decryption)
- `nonce` — the AES-GCM nonce

The ephemeral secret `k` is **discarded**. It's never stored anywhere.

---

## The Full Picture

```
   You (SDK)                                    Handle Gateway / S3
      │                                               │
      │  k = random()                                  │
      │  K = k * G                                     │
      │  S = k * pubkey_KMS                            │
      │  aes_key = HKDF(S)                             │
      │  ciphertext = AES_GCM(aes_key, nonce, 1000)    │
      │                                                │
      │── store(handle, ciphertext, K, nonce) ────────>│
      │                                                │── saved to S3
      │  discard k ✓                                   │
```

---

## Why Not Just Use AES?

Good question. AES alone would work for encryption, but you'd need a way to **share the AES key** securely. ECIES solves this by using elliptic curves to establish a shared secret without ever transmitting a key.

| Approach | Problem |
|---|---|
| AES alone | How do you share the key securely? |
| RSA encryption | Works but is slower and produces larger ciphertexts |
| **ECIES** | Combines the best of both: EC for key agreement, AES for fast encryption |

---

## Why secp256k1?

Nox uses the secp256k1 curve because:

1. **Ethereum compatibility** — wallets already use this curve for signing
2. **Battle-tested** — billions of dollars secured by this curve across Bitcoin and Ethereum
3. **Efficient** — fast operations, small key sizes (32 bytes)

---

## Key Takeaways

1. **ECIES = elliptic curve key agreement + AES encryption.** It's a hybrid scheme that combines the best of asymmetric and symmetric cryptography.

2. **The KMS public key is the "lock."** Anyone can encrypt data for the protocol. Only the KMS (or its delegates) can help decrypt.

3. **Each encryption uses a fresh ephemeral key** (`k`). Even if two users encrypt the same value, the ciphertexts are completely different.

4. **The ephemeral key is discarded** after encryption. This provides **forward secrecy** — even if `k` were somehow recovered later, it's useless because it no longer exists.

5. **The KMS never decrypts directly.** Decryption works through delegation (see [article 07](./07-decryption-delegation.md)).

---

*Next in the series: [07 — Decryption Delegation](./07-decryption-delegation.md)*
