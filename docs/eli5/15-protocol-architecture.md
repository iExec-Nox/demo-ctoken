# The Protocol Architecture — 6 Components (ELI5)

> **TL;DR** — Nox has six main parts that work together like a factory assembly line: the smart contract takes orders, the Ingestor reads orders off the board, NATS delivers them to the workshop, the Runner does the work, the Handle Gateway stores the finished products, and the KMS manages the master key.

---

## The Factory Analogy

Imagine a **confidential manufacturing factory**:

```
┌────────────────────────────────────────────────────────────────────┐
│                        THE NOX FACTORY                             │
│                                                                    │
│  FRONT DESK          MAILROOM        CONVEYOR       WORKSHOP       │
│  ┌──────────┐       ┌─────────┐     ┌───────┐     ┌──────────┐   │
│  │NoxCompute│──────>│Ingestor │────>│ NATS  │────>│  Runner  │   │
│  │(on-chain)│       │         │     │       │     │ (in TEE) │   │
│  └──────────┘       └─────────┘     └───────┘     └────┬─────┘   │
│                                                         │         │
│  VAULT               KEY ROOM                           │         │
│  ┌──────────────┐   ┌────────┐                          │         │
│  │Handle Gateway│<──┤  KMS   │<─────────────────────────┘         │
│  │  (storage)   │   │(keys)  │                                    │
│  └──────────────┘   └────────┘                                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

| Factory part | Nox component | Job |
|---|---|---|
| Front desk | **NoxCompute** (smart contract) | Takes customer orders (validates handles, emits events) |
| Mailroom | **Ingestor** | Reads the order board (polls blockchain), sorts orders, delivers to conveyor |
| Conveyor belt | **NATS JetStream** | Reliable delivery system between mailroom and workshop |
| Workshop | **Runner** | Does the actual confidential work (decrypts, computes, encrypts) |
| Vault | **Handle Gateway** | Stores all encrypted products (handles → ciphertext) |
| Key room | **KMS** | Holds the master key, delegates access to authorized workers |

---

## Component 1: NoxCompute (Smart Contract)

**What it is:** A Solidity smart contract deployed on-chain (Arbitrum Sepolia).

**What it does:**
- Validates handle proofs (EIP-712 signatures for user-created handles)
- Checks type compatibility (can't add a `euint256` to an `ebool`)
- Computes deterministic result handles
- Grants transient ACL access to result handles
- Emits events that trigger off-chain computation

**What it doesn't do:** Any actual computation on encrypted data. It only manages handles and access control.

```
User → NoxCompute: "add(handle_a, handle_b)"
NoxCompute: validates inputs → computes result handle → emits event → done
(Actual math happens later, off-chain)
```

---

## Component 2: Ingestor

**What it is:** A Rust service running inside Intel TDX.

**What it does:**
- Polls new blockchain blocks at regular intervals
- Filters for NoxCompute events
- Groups events by transaction (preserving execution order via `log_index`)
- Publishes structured messages to NATS JetStream

**Key design choices:**
- **Optimistic processing**: Handles blocks immediately, doesn't wait for confirmations. If a block reorg happens, the affected handle is removed.
- **Deduplication**: Uses content-based message IDs so restarting the Ingestor doesn't create duplicate work.
- **State persistence**: Saves the last processed block number to disk, so it resumes from where it left off after restarts.

---

## Component 3: NATS JetStream

**What it is:** A message queue (like a conveyor belt between the Ingestor and Runner).

**What it does:**
- Receives `TransactionMessage` messages from the Ingestor
- Delivers them reliably to Runners
- Ensures each message is processed exactly once (even with multiple Runners)
- Provides acknowledgment: once a Runner confirms it processed a message, NATS removes it

**Why a message queue?** It decouples the Ingestor from the Runner. The Ingestor can keep reading blocks even if the Runner is busy. Messages queue up and get processed in order.

---

## Component 4: Runner

**What it is:** A Rust service running inside Intel TDX — the computation engine.

**What it does:**
1. Pulls a message from NATS
2. Fetches encrypted operands from Handle Gateway
3. Decrypts inputs inside the TEE
4. Executes the computation (add, sub, transfer, etc.)
5. Encrypts the result with the KMS public key
6. Stores the encrypted result in Handle Gateway
7. Acknowledges the message

**Critical property:** The Runner is the **only component that ever sees plaintext** data — and only in memory, inside the TEE, never on disk.

**Current state:** Single Runner. Future architecture will support multiple parallel Runners for horizontal scaling.

---

## Component 5: Handle Gateway

**What it is:** A Rust service running inside Intel TDX — the encrypted data store.

**What it does:**
- **Stores** encrypted handle data (ciphertext + ephemeral public key + nonce) in AWS S3
- **Encrypts** user input values (when users call `encryptInput` via the SDK)
- **Serves** encrypted operands to the Runner (for computation)
- **Coordinates** decryption delegation with the KMS (when users call `decrypt`)
- **Verifies** on-chain ACL permissions before serving decryption material

**Think of it as:** The librarian. It stores encrypted books (handles), lends them to authorized readers (Runner, users), and checks library cards (ACL) before giving anything out.

---

## Component 6: KMS (Key Management Service)

**What it is:** A Rust service running inside Intel TDX — the key custodian.

**What it does:**
- Holds the protocol's **master private key** (secp256k1)
- Publishes the corresponding **public key** (used by everyone to encrypt)
- Performs **decryption delegation** (computes ECDH shared secrets, wraps them in the requester's RSA key)

**What it never does:** Decrypt actual data. It only provides the cryptographic material needed for others to decrypt locally.

**Current state:** Single KMS node. Target architecture: threshold cryptography with Shamir's Secret Sharing across multiple nodes (see [article 16](./16-kms-and-threshold-cryptography.md)).

---

## How They All Connect

Here's a complete operation flow — Alice wraps 100 USDC:

```
Alice (browser)
  │
  ├─①─> Handle Gateway: "encrypt 100"
  │        └── encrypts, stores in S3, returns handle + proof
  │
  ├─②─> NoxCompute (on-chain): "wrap(handle, proof)"
  │        └── validates, emits event, returns result handle
  │
  │      Ingestor ─③─> polls block, finds event
  │        └── publishes to NATS
  │
  │      NATS ─④─> delivers message to Runner
  │
  │      Runner ─⑤─> fetches operands from Handle Gateway
  │        └── Handle Gateway coordinates with KMS for decryption
  │        └── Runner decrypts in TEE, computes, encrypts result
  │        └── Runner stores result in Handle Gateway
  │
  ├─⑥─> Handle Gateway: "decrypt my balance handle"
  │        └── checks ACL, coordinates with KMS
  │        └── returns delegation material
  │        └── Alice decrypts locally → sees 100 ✓
```

---

## Key Takeaways

1. **6 components, clear separation of concerns.** Each does one job well.

2. **On-chain is minimal.** NoxCompute only validates handles and emits events — no actual computation on encrypted data.

3. **Off-chain is where the work happens.** Ingestor → NATS → Runner pipeline processes computations asynchronously.

4. **Everything sensitive runs in TEEs.** Runner, KMS, Handle Gateway, and Ingestor all run inside Intel TDX enclaves.

5. **The KMS is the trust anchor** but never sees plaintext. It holds the master key and delegates decryption material.

---

*Next in the series: [16 — KMS & Threshold Cryptography](./16-kms-and-threshold-cryptography.md)*
