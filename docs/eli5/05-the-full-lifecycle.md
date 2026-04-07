# The Full Lifecycle — Input, Compute, Output (ELI5)

> **TL;DR** — Every confidential operation in Nox follows three phases: (1) you encrypt your data and submit a handle on-chain, (2) a secure off-chain worker does the math, (3) you decrypt the result locally. The blockchain never sees plaintext at any point.

---

## The Mail-Order Lab Analogy

Imagine you have two secret ingredients and you want to know what happens when you mix them — but you don't trust anyone with the formulas.

1. **Input**: You seal each ingredient in a **tamper-proof box** and mail it to a lab, keeping a **tracking number** for each box.
2. **Compute**: The lab receives the boxes, opens them inside a **sealed clean room** (nobody can watch), mixes the ingredients, seals the result in a new box, and gives it a new tracking number.
3. **Output**: You give the lab your tracking number and prove you're the owner. They send you the result. You open it at home.

At no point did anyone outside the clean room see what was in the boxes. The tracking numbers (handles) traveled through the public mail system, but they reveal nothing about the contents.

---

## Phase 1: Input

This is where your secret data enters the protocol.

```
    You (browser)                Handle Gateway              Blockchain
         │                            │                          │
    ①    │── encrypt(1000) ──────────>│                          │
         │                            │── encrypt with           │
         │                            │   KMS public key         │
         │                            │── store in S3            │
    ②    │<── handle + proof ─────────│                          │
         │                                                       │
    ③    │── wrap(handle, proof) ────────────────────────────────>│
         │                            │                          │
         │                            │      Contract verifies   │
         │                            │      proof, calls        │
         │                            │      Nox.add(balance,    │
         │                            │              handle)     │
         │                            │                          │
    ④    │                            │      Emits event with    │
         │                            │      input/output handles│
         │                            │      Returns new handle  │
```

Step by step:

1. **You encrypt** your value (e.g., `1000`) using the JS SDK. The SDK sends the plaintext to the Handle Gateway.
2. **The Handle Gateway** encrypts the value using ECIES with the KMS public key, stores the ciphertext in S3, and returns a **handle** (32-byte pointer) plus an **EIP-712 proof** (to prove the handle is legitimate).
3. **You submit** the handle and proof to the smart contract (e.g., calling `wrap()`).
4. **The contract** verifies the proof via `Nox.fromExternal()`, performs operations (e.g., `Nox.add(balance, handle)`), emits an event with input and output handles, and returns the result handle. The transaction completes on-chain — but the actual computation hasn't happened yet.

---

## Phase 2: Compute

This is where the actual math happens — entirely off-chain, inside a TEE.

```
    Blockchain          Ingestor           NATS            Runner
         │                  │                │                │
    ①    │── new block ────>│                │                │
         │                  │── parse logs   │                │
         │                  │── group by tx  │                │
    ②    │                  │── publish ────>│                │
         │                  │                │                │
    ③    │                  │                │── pull ───────>│
         │                  │                │                │
         │                  │                │    ┌───────────┤
         │                  │                │    │ Inside TEE│
         │                  │                │    │           │
    ④    │                  │                │    │ Fetch     │
         │                  │                │    │ encrypted │
         │                  │                │    │ operands  │
         │                  │                │    │ from      │
         │                  │                │    │ Handle GW │
         │                  │                │    │           │
    ⑤    │                  │                │    │ Decrypt   │
         │                  │                │    │ inputs    │
         │                  │                │    │           │
    ⑥    │                  │                │    │ Compute:  │
         │                  │                │    │ 0 + 1000  │
         │                  │                │    │ = 1000    │
         │                  │                │    │           │
    ⑦    │                  │                │    │ Encrypt   │
         │                  │                │    │ result    │
         │                  │                │    │           │
    ⑧    │                  │                │    │ Store in  │
         │                  │                │    │ Handle GW │
         │                  │                │    └───────────┤
         │                  │                │                │
    ⑨    │                  │                │<── ack ────────│
```

Step by step:

1. **The Ingestor** polls new blockchain blocks and detects NoxCompute events.
2. **Events are grouped** by transaction (preserving execution order) and published to **NATS JetStream** (a message queue).
3. **The Runner** pulls the message from NATS.
4. **The Runner** fetches the encrypted operands from the Handle Gateway, providing an ephemeral RSA public key.
5. **Inside the TEE**, the Runner decrypts the inputs (via KMS decryption delegation).
6. **The Runner computes** the operation (e.g., `0 + 1000 = 1000`).
7. **The Runner encrypts** the result using ECIES with the KMS public key.
8. **The encrypted result** is stored in the Handle Gateway, associated with the output handle.
9. **The Runner acknowledges** the message, removing it from the queue.

TOLEARN: pourquoi on dit que c'est stored in the handle gateways

The plaintext value `1000` only ever existed **in the Runner's TEE memory** — never on disk, never on-chain, never in transit unencrypted.

---

## Phase 3: Output

This is where you retrieve your data.

```
    You (browser)                Handle Gateway              KMS
         │                            │                       │
    ①    │── generate RSA keypair     │                       │
         │── sign EIP-712 request     │                       │
         │── decrypt(handle, sig) ───>│                       │
         │                            │                       │
    ②    │                            │── check ACL on-chain  │
         │                            │   (is this address    │
         │                            │    a viewer?)         │
         │                            │                       │
    ③    │                            │── request delegation ─>│
         │                            │                       │── compute shared
         │                            │                       │   secret
         │                            │                       │── encrypt with
         │                            │<── delegation material│   requester's
         │                            │                       │   RSA public key
         │                            │                       │
    ④    │<── ciphertext + encrypted  │                       │
         │    shared secret + nonce   │                       │
         │                            │                       │
    ⑤    │── decrypt locally          │                       │
         │   (RSA → shared secret     │                       │
         │    → AES key → plaintext)  │                       │
         │                            │                       │
         │   Result: 1000 ✓           │                       │
```

Step by step:

1. **You generate** an ephemeral RSA keypair and sign an EIP-712 message requesting decryption of a specific handle.
2. **The Handle Gateway** verifies your signature and checks the on-chain ACL — are you a viewer for this handle?
3. **The Handle Gateway** requests decryption delegation from the KMS. The KMS computes the ECDH shared secret and encrypts it with your RSA public key.
4. **You receive** the ciphertext, the RSA-encrypted shared secret, and the nonce.
5. **You decrypt locally**: RSA-decrypt the shared secret → derive the AES key via HKDF → decrypt the ciphertext with AES-256-GCM.

**The KMS never sees the plaintext.** It only provides the encrypted shared secret. The final decryption happens in your browser.

---

## The Complete Picture

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   PHASE 1: INPUT          PHASE 2: COMPUTE                 │
│                                                             │
│   User encrypts ──> Handle on-chain ──> Ingestor ──> NATS  │
│                                                     │      │
│                                                     ▼      │
│                                                   Runner   │
│                                                 (in TEE)   │
│                                                     │      │
│                                                     ▼      │
│   PHASE 3: OUTPUT         Handle Gateway <── Result        │
│                                │                           │
│   User decrypts <── KMS delegation                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **Three phases**: Input (encrypt + submit handle), Compute (off-chain TEE math), Output (decrypt locally).

2. **The blockchain only sees handles.** No plaintext value ever touches the chain.

3. **Computation is asynchronous.** The smart contract emits an event and returns immediately. The actual math happens off-chain moments later.

4. **Decryption is gasless.** It uses EIP-712 signatures, not on-chain transactions. No gas fees to check your balance.

5. **Plaintext exists only in two places**: inside the Runner's TEE (during computation) and in your browser (after decryption). Nowhere else, ever.

---

_Next in the series: [06 — ECIES Encryption](./06-ecies-encryption.md)_
