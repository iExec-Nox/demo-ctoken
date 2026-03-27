# The Handle Gateway (ELI5)

> **TL;DR** — The Handle Gateway is the single front door for all encrypted data in Nox. It encrypts your inputs, stores the ciphertext, serves it to the Runner for computation, and coordinates decryption when you want to read a value back. Think of it as a secure post office — it handles every package, but never opens any of them.

---

## The Secure Post Office Analogy

Imagine a post office with very strict rules:

1. **Sending a package** — You bring a valuable item. The clerk seals it in a tamper-proof box in a back room (TEE) and gives you a **tracking number** (handle). The clerk never looks at the item.
2. **Storage** — The sealed box goes into a warehouse (S3). Only the tracking number is written on the outside.
3. **Processing** — When the factory (Runner) needs your item, it shows up with authorization. The clerk fetches the sealed box and hands it over. The factory opens it in its own locked room (TEE).
4. **Picking up** — When you want your item back, you show your ID (wallet signature). The clerk checks the access list (ACL on-chain), then helps you unseal the box — without ever seeing inside.

The post office handles every package in the system, but **never sees what's inside any of them**.

---

## What The Handle Gateway Actually Does

The Handle Gateway is a **Rust service running inside Intel TDX**. It has four main jobs:

### 1. Encrypt User Inputs

When you type "100" in the wrap modal and click confirm, here's what happens:

```
Your browser (SDK):
  handleClient.encryptInput(100, "uint256", contractAddress)
        │
        ▼
Handle Gateway (in TEE):
  1. Receives the plaintext value over RA-HTTPS
  2. Encrypts it with the KMS public key (ECIES on secp256k1)
  3. Stores the ciphertext in S3
  4. Generates a handle (32-byte pointer)
  5. Signs an EIP-712 proof: "this handle is legit"
  6. Returns handle + proof to your browser
```

After this, your browser only has the handle and the proof — the plaintext `100` no longer exists anywhere except encrypted in S3.

### 2. Store Encrypted Data

Every ciphertext in the Nox protocol lives in the Handle Gateway's S3 storage. For each handle, it stores:

| Field | What it is |
|---|---|
| **Ciphertext** | The AES-256-GCM encrypted value |
| **Ephemeral public key** | The ECIES ephemeral key `K` (needed for decryption) |
| **Nonce** | The 12-byte AES-GCM nonce |
| **Handle** | The 32-byte on-chain pointer |

The handle is the key to find the box. The box itself contains everything needed to decrypt — if you have the right key.

### 3. Serve Data to the Runner

When the Runner needs to compute `add(handle_a, handle_b)`, it asks the Handle Gateway for the encrypted operands:

```
Runner → Handle Gateway: "I need the ciphertext for handle_a and handle_b"
Handle Gateway:
  1. Fetches both ciphertexts from S3
  2. Coordinates with KMS to get decryption material
  3. Returns encrypted operands to the Runner
Runner (in TEE):
  1. Decrypts operands
  2. Computes: result = a + b
  3. Encrypts result with KMS public key
  4. Sends encrypted result back to Handle Gateway
Handle Gateway:
  1. Stores the new ciphertext in S3
  2. The result handle (already computed on-chain by NoxCompute) now points to real data
```

### 4. Coordinate Decryption for Users

When you click the "eye" icon to reveal your cRLC balance:

```
Your browser → Handle Gateway: "I want to decrypt handle 0xABC..."
                                + EIP-712 signature + RSA public key

Handle Gateway:
  1. Verify the EIP-712 signature (proves your identity)
  2. Check on-chain ACL: isViewer(handle, yourAddress)?
  3. If not authorized → reject
  4. If authorized → ask KMS for decryption delegation
  5. KMS computes shared secret, wraps it in your RSA key
  6. Handle Gateway returns: encrypted shared secret + ciphertext + nonce

Your browser:
  1. RSA-decrypt the shared secret
  2. Derive AES key (HKDF)
  3. AES-GCM decrypt → plaintext value ✓
```

The Handle Gateway sees the encrypted shared secret pass through, but can't use it — it's locked with your RSA public key.

---

## What The Handle Gateway Never Does

This is just as important as what it does:

| Action | Does it? | Why not |
|---|---|---|
| Decrypt user data | **No** | It coordinates decryption delegation with the KMS, but never holds the shared secret in the clear |
| Store plaintext | **No** | Only ciphertext lives in S3 |
| Decide permissions | **No** | It reads the ACL from the blockchain — the smart contract is the source of truth |
| Compute on encrypted data | **No** | That's the Runner's job |

---

## Why It Runs in a TEE

Even though the Handle Gateway never sees plaintext values, it still handles sensitive material:

- **Plaintext inputs** briefly pass through during encryption (the user sends `100`, the gateway encrypts it)
- **Decryption coordination** involves cryptographic material (shared secrets wrapped in RSA)
- **It knows which handles exist** — metadata can reveal information (e.g., "this address made 10 transactions today")

Running inside Intel TDX ensures:
- The plaintext input during encryption is protected in hardware-isolated memory
- The cloud provider can't snoop on encryption/decryption requests
- Metadata about handle access patterns is protected

---

## The Gateway in the Big Picture

```
                    ┌──────────────────┐
  You (SDK) ──────> │  Handle Gateway   │ <────── Runner
   encrypt          │   (Intel TDX)     │          fetch/store
   decrypt          │                   │
                    │   ┌───────────┐   │
                    │   │  S3 Store │   │
                    │   │(ciphertext)│  │
                    │   └───────────┘   │
                    │         ▲         │
                    │         │         │
                    │   ┌─────┴─────┐   │
                    │   │    KMS    │   │
                    │   │(delegation)│  │
                    │   └───────────┘   │
                    └──────────────────┘
                             ▲
                             │
                    ┌────────┴────────┐
                    │   Blockchain     │
                    │  (ACL checks)    │
                    └─────────────────┘
```

Every arrow into or out of the Handle Gateway carries **only encrypted or signed data**. Plaintext only exists momentarily during input encryption, inside TEE memory.

---

## Key Takeaways

1. **The Handle Gateway is the single entry point** for all encrypted data in Nox — input encryption, ciphertext storage, and decryption coordination.

2. **It stores ciphertext in S3**, indexed by handle. Each entry contains the encrypted value, the ephemeral key, and the nonce.

3. **It never decrypts user data.** For decryption, it coordinates with the KMS (delegation) and checks the on-chain ACL — but the plaintext only appears in the user's browser.

4. **It briefly sees plaintext during input encryption** — this is why it runs inside Intel TDX, so even this brief exposure is hardware-protected.

5. **Permissions come from the blockchain**, not from the Handle Gateway. It reads `isViewer` and `isAllowed` from the on-chain ACL contract before serving any decryption material.

---

*Next in the series: [22 — Remote Attestation & Proof of Cloud](./22-remote-attestation.md)*
