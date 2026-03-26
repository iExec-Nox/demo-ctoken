# Decryption Delegation (ELI5)

> **TL;DR** — The KMS holds the master key but never decrypts your data. Instead, it gives you the cryptographic material to decrypt it yourself. It's like a locksmith who cuts you a key but never enters your house.

---

## The Locksmith Analogy

You have a safe deposit box at a vault. The vault manager has the master key, but here's the policy:

1. You show up with **your ID** (wallet signature) and a **padlock of your own** (your RSA public key).
2. The vault manager checks the **access list** (ACL) — are you authorized?
3. If yes, the manager uses the master key to create a **copy of the safe key**, locks it inside **your padlock**, and hands it to you.
4. You take it home and use **your padlock key** (RSA private key) to extract the safe key.
5. You open the safe yourself.

The vault manager never opened your safe. Never saw what's inside. They just provided you the means to do it yourself.

---

## Why Not Just Decrypt at the Server?

It would be simpler if the KMS just decrypted the data and sent it back to you. But that creates a problem:

| Approach | Risk |
|---|---|
| **KMS decrypts and sends plaintext** | Plaintext travels over the network. Anyone intercepting traffic sees your data. The KMS also sees your data — you're trusting a server. |
| **Decryption delegation** | Only encrypted material travels over the network. Plaintext only exists in your browser. The KMS **never** sees your data. |

Delegation is the difference between "the bank reads your letter and tells you what it says" vs. "the bank gives you the key to read it yourself."

---

## How It Works, Step by Step

Let's say you want to decrypt your cUSDC balance.

### Step 1: You Prepare

```
Your browser:
  1. Generate ephemeral RSA keypair (public + private)
  2. Build an EIP-712 message: "I want to decrypt handle 0xABC..."
  3. Sign it with your Ethereum wallet
```

The EIP-712 signature proves you own the wallet address. The RSA public key gives the KMS a way to encrypt the response so only you can read it.

### Step 2: Handle Gateway Checks

```
Handle Gateway:
  1. Verify EIP-712 signature → confirms your identity
  2. Read on-chain ACL → is your address a viewer for this handle?
  3. If not authorized → reject ✘
  4. If authorized → proceed to KMS
```

### Step 3: KMS Delegates

```
KMS:
  1. Receive the handle's ephemeral public key (K) + your RSA public key
  2. Compute: shared_secret = privkey_KMS * K
  3. Encrypt shared_secret with your RSA public key
  4. Return encrypted_shared_secret to Handle Gateway
```

The KMS computes the ECDH shared secret (the same one that was used during encryption) but **never uses it to decrypt anything**. It immediately wraps it in your RSA public key.

### Step 4: You Decrypt Locally

```
Your browser:
  1. RSA-decrypt the shared_secret using your RSA private key
  2. Derive AES key: HKDF-SHA256(shared_secret)
  3. AES-256-GCM decrypt: plaintext = decrypt(ciphertext, aes_key, nonce)
  4. Result: 1000 ✓
```

---

## What Each Party Sees

| Party | What they see |
|---|---|
| **You** | The plaintext value (after local decryption) |
| **Handle Gateway** | Your request, the handle, the encrypted response — never the plaintext |
| **KMS** | The handle's ephemeral key `K`, your RSA public key — never the plaintext, never the shared secret in the clear |
| **Network observer** | Encrypted traffic — nothing useful |

The plaintext value `1000` only exists in one place: **your browser's memory**.

---

## The Gasless Advantage

Notice that decryption doesn't require an on-chain transaction. The entire flow uses:

- An **EIP-712 signature** (free — just a wallet popup)
- **HTTPS requests** to the Handle Gateway

No gas fees. No blockchain transaction. You can check your confidential balance as often as you want without paying anything.

---

## The Security Chain

```
Your wallet signature
    │
    ▼
proves your identity
    │
    ▼
ACL check (on-chain)
    │
    ▼
proves you're authorized
    │
    ▼
KMS computes shared secret
    │
    ▼
wraps it in your RSA key
    │
    ▼
only your RSA private key can unwrap
    │
    ▼
only you get the plaintext
```

Every link in this chain prevents a different attack:
- No wallet signature → can't impersonate you
- No ACL entry → unauthorized users rejected
- RSA wrapping → shared secret is useless to anyone else
- Ephemeral RSA keys → no key reuse across requests

---

## Key Takeaways

1. **The KMS never decrypts data.** It computes a shared secret and wraps it in your RSA public key. That's it.

2. **Plaintext never travels over the network.** Only encrypted material is transmitted. You perform the final decryption locally.

3. **Decryption is gasless.** It uses EIP-712 signatures — just a wallet popup, no transaction, no fees.

4. **Authorization is verified on-chain.** The Handle Gateway checks the ACL contract to confirm you're a viewer before asking the KMS for anything.

5. **Ephemeral RSA keys** are generated fresh for each request, preventing key reuse attacks.

---

*Next in the series: [08 — Access Control Lists (ACL)](./08-acl.md)*
