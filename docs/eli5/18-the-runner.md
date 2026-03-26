# The Runner (ELI5)

> **TL;DR** — The Runner is the worker that does the actual math on your secret data. It's the only component that ever sees plaintext values — but only in memory, inside a locked room (TEE), for the briefest moment needed to compute the result.

---

## The Clean Room Technician Analogy

Imagine a **semiconductor clean room** — a sealed, controlled environment:

1. Sealed packages arrive through an airlock (encrypted handles from NATS).
2. The technician **opens** the packages inside the clean room (decrypts inputs).
3. The technician **assembles** the components (performs the computation).
4. The technician **seals** the result in a new package (encrypts the output).
5. The sealed package exits through the other airlock (stored in Handle Gateway).
6. The technician **destroys all scraps** (plaintext only in memory, never on disk).

Nobody outside the clean room saw the components. The technician can prove they followed the correct procedure (remote attestation). The result is sealed and can only be opened by authorized recipients.

---

## What the Runner Does

```
NATS ──pull──> Runner (inside TEE) ──store──> Handle Gateway
                    │
                    │  1. Fetch encrypted operands
                    │  2. Decrypt inputs (via KMS delegation)
                    │  3. Execute computation
                    │  4. Encrypt result (ECIES with KMS public key)
                    │  5. Submit encrypted result
                    │  6. Acknowledge message
                    │
                    └── Plaintext only exists HERE, in memory
```

### The 7-Step Cycle

| Step | Action | Where |
|---|---|---|
| 1 | Pull `TransactionMessage` from NATS | Runner ↔ NATS |
| 2 | Fetch encrypted operands from Handle Gateway (with ephemeral RSA key) | Runner ↔ Handle Gateway |
| 3 | Decrypt inputs locally (RSA → shared secret → AES key → plaintext) | Inside TEE memory |
| 4 | Execute the computation primitive (add, sub, transfer, etc.) | Inside TEE memory |
| 5 | Encrypt the result using ECIES with the KMS public key | Inside TEE memory |
| 6 | Submit encrypted result to Handle Gateway | Runner ↔ Handle Gateway |
| 7 | Acknowledge the NATS message (removes it from queue) | Runner ↔ NATS |

---

## Supported Operations

The Runner can execute these computation primitives:

### Basic Operations

| Operation | Inputs | Outputs | Description |
|---|---|---|---|
| `plaintextToEncrypted` | 0 handles (value in event) | 1 | Encrypt a plaintext constant |
| `add` | 2 | 1 | Addition (wrapping) |
| `sub` | 2 | 1 | Subtraction (wrapping) |
| `mul` | 2 | 1 | Multiplication (wrapping) |
| `div` | 2 | 1 | Division (wrapping) |

### Safe Arithmetic

| Operation | Inputs | Outputs | Description |
|---|---|---|---|
| `safeAdd` | 2 | 2 | Addition + overflow flag |
| `safeSub` | 2 | 2 | Subtraction + underflow flag |
| `safeMul` | 2 | 2 | Multiplication + overflow flag |
| `safeDiv` | 2 | 2 | Division + zero-divisor flag |

### Comparisons

| Operation | Inputs | Outputs | Description |
|---|---|---|---|
| `eq`, `ne` | 2 | 1 (ebool) | Equal / Not equal |
| `lt`, `le` | 2 | 1 (ebool) | Less than / Less or equal |
| `gt`, `ge` | 2 | 1 (ebool) | Greater than / Greater or equal |

### Conditional

| Operation | Inputs | Outputs | Description |
|---|---|---|---|
| `select` | 3 (condition, ifTrue, ifFalse) | 1 | Encrypted if/else |

### Token Operations

| Operation | Inputs | Outputs | Description |
|---|---|---|---|
| `transfer` | 3 (amount, fromBal, toBal) | 3 | Atomic transfer with silent cap |
| `mint` | 3 (amount, toBal, supply) | 3 | Create tokens + update supply |
| `burn` | 3 (amount, fromBal, supply) | 3 | Destroy tokens + update supply |

---

## The `plaintextToEncrypted` Exception

Most operations take encrypted handles as input. But `plaintextToEncrypted` is special — it takes a **plaintext value** directly from the on-chain event data:

```solidity
// In the smart contract:
euint256 zero = Nox.toEuint256(0);
// Emits an event with: operator=plaintextToEncrypted, value=0, type=euint256
```

The Runner receives this event, encrypts `0` using ECIES, and stores the result. No input handles needed — just a value to encrypt.

---

## Wrapping Semantics

All arithmetic follows **Solidity's unchecked behavior**:

```
uint256.max + 1 = 0    (wraps around)
0 - 1 = uint256.max    (wraps around)
```

This matches what `unchecked { }` blocks do in Solidity. The Runner doesn't revert on overflow — it wraps. Token operations (`transfer`, `mint`, `burn`) handle this differently by silently capping at available balances.

---

## Validation Rules

Before executing, the Runner validates:

```
For each input handle:
  ✓ Must exist in Handle Gateway (has ciphertext behind it)

For each output handle:
  ✓ Must NOT exist in Handle Gateway (it's a new result)

If any check fails → reject the entire TransactionMessage
```

This prevents:
- **Missing inputs**: Can't compute on data that doesn't exist
- **Handle collisions**: Can't overwrite existing encrypted data

---

## Security Properties

| Property | How it's achieved |
|---|---|
| Plaintext never on disk | Runner processes everything in memory |
| Plaintext never in transit | Inputs arrive encrypted, results leave encrypted |
| Correct execution | Remote attestation proves the right code is running |
| No tampering | TEE hardware isolation prevents OS/admin interference |
| Result integrity | Deterministic handles mean anyone can verify the handle matches the operation |

---

## Current vs. Future Architecture

```
Today:
  ┌────────┐
  │ Runner │ ← single instance
  └────────┘

Future:
  ┌────────┐  ┌────────┐  ┌────────┐
  │Runner 1│  │Runner 2│  │Runner 3│  ← multiple parallel instances
  └────────┘  └────────┘  └────────┘
       │           │           │
       └─────── TDX Orchestrator ──────┘
```

Multiple Runners will enable **horizontal scaling** — more Runners means more computations processed in parallel, increasing throughput for the entire protocol.

---

## Key Takeaways

1. **The Runner is the only component that sees plaintext** — and only in TEE memory, for the briefest moment.

2. **It supports all operations**: basic arithmetic, safe arithmetic, comparisons, conditional selection, and atomic token operations.

3. **Wrapping semantics**: arithmetic wraps on overflow (like Solidity's `unchecked`). Token operations silently cap instead.

4. **Strict validation**: all input handles must exist, all output handles must be new. No exceptions.

5. **Currently single-instance**, but the architecture is designed for horizontal scaling with multiple parallel Runners.

---

*Next in the series: [19 — Privacy by Convergence](./19-privacy-by-convergence.md)*
