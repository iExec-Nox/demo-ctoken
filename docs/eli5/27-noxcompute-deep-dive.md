# NoxCompute Deep Dive (ELI5)

> **TL;DR** — NoxCompute is the **computation brain** of the Nox protocol. It's a single contract, deployed once per chain, that does three things: manage permissions (ACL), trigger computations on encrypted data (arithmetic, comparisons, transfers), and validate cryptographic proofs. It never stores values — it only manipulates **handles**.

---

## The Common Misconception

When reading the ERC-7984 (cToken) contract, you might think NoxCompute is just a "permission manager". That's what article 26 in this series used to say — and it was **incomplete**.

In reality, NoxCompute is much more than a bouncer. It's the **universal calculator** of the protocol. Every operation on encrypted data — addition, comparison, transfer, mint, burn — goes through NoxCompute.

---

## The Analogy: The Blind Notary-Calculator

Imagine a specialized notary who:

1. **Never sees the amounts** — only handles file reference numbers (handles)
2. **Checks authorizations** — "is this person allowed to touch this file?"
3. **Issues computation orders** — "file A + file B = new file C"
4. **Validates proofs** — when a result comes back from the vault (TEE), verifies the signature

The actual computation happens in the vault (the Runner TEE). The notary only **coordinates** and **authenticates**.

```
 cToken contract                NoxCompute                    Runner (TEE)
 (the application)             (the notary)                  (the vault)
      |                              |                              |
      |-- "Add A + B" ------------->|                              |
      |                              |-- Checks ACL                 |
      |                              |-- Generates handle C         |
      |                              |-- Emits Add event --------->|
      |                              |                              |-- Decrypts A and B
      |                              |                              |-- Computes A + B
      |                              |                              |-- Encrypts result
      |<-- handle C ----------------|                              |-- Stores under handle C
      |                              |                              |
```

---

## The 5 Function Families

NoxCompute is organized into 5 functional blocks. Here's the complete map:

```
NoxCompute.sol
+-- 1. ACL (Access Control)
|   +-- allow()              -- grant permanent access (admin)
|   +-- allowTransient()     -- temporary access (1 transaction)
|   +-- disallowTransient()  -- revoke temporary access
|   +-- isAllowed()          -- check access (admin or transient)
|   +-- validateAllowedForAll() -- check N handles at once
|   +-- addViewer()          -- grant decryption rights
|   +-- isViewer()           -- check read permission
|   +-- allowPublicDecryption() -- make a handle readable by everyone
|   +-- isPubliclyDecryptable() -- check if public
|
+-- 2. Arithmetic
|   +-- add(a, b)            -- addition (wrapping)
|   +-- sub(a, b)            -- subtraction (wrapping)
|   +-- mul(a, b)            -- multiplication (wrapping)
|   +-- div(a, b)            -- division (wrapping)
|   +-- safeAdd(a, b)        -- addition + overflow flag
|   +-- safeSub(a, b)        -- subtraction + underflow flag
|   +-- safeMul(a, b)        -- multiplication + overflow flag
|   +-- safeDiv(a, b)        -- division + div-by-zero flag
|
+-- 3. Comparisons
|   +-- eq(a, b)             -- a == b ?
|   +-- ne(a, b)             -- a != b ?
|   +-- lt(a, b)             -- a < b ?
|   +-- le(a, b)             -- a <= b ?
|   +-- gt(a, b)             -- a > b ?
|   +-- ge(a, b)             -- a >= b ?
|
+-- 4. Composite Operations
|   +-- select(cond, a, b)   -- encrypted if/else
|   +-- transfer(from, to, amount)  -- atomic transfer
|   +-- mint(to, amount, supply)    -- atomic creation
|   +-- burn(from, amount, supply)  -- atomic destruction
|
+-- 5. Handle & Proof Management
    +-- wrapAsPublicHandle() -- convert a public value into a handle
    +-- validateInputProof() -- verify an input proof (from Gateway)
    +-- validateDecryptionProof() -- verify a decryption proof
```

---

## What Is an Operand?

In NoxCompute's code, the parameters of compute functions are called **operands**. They are always `bytes32` — meaning **handles**, not values.

```solidity
function add(
    bytes32 leftHandOperand,   // <-- handle pointing to encrypted value "A"
    bytes32 rightHandOperand   // <-- handle pointing to encrypted value "B"
) external returns (bytes32 result);  // <-- new handle pointing to "A + B"
```

**The analogy:** you hand the notary two file reference numbers. He doesn't know what's inside them. He creates a new "result" file and tells the vault: "open files X and Y, add the amounts, and store the result in file Z."

### Operands vs. Values — The Key Distinction

```
Public world (ERC-20)          Confidential world (NoxCompute)
─────────────────────          ──────────────────────────────
balanceOf(alice) -> 1000       confidentialBalanceOf(alice) -> 0xab12...
a + b = 1500                   add(0xab12..., 0xcd34...) -> 0xef56...
                               (we don't know what computation happened
                                or what the result is)
```

Operands must follow 3 rules:
1. **Non-zero** — `bytes32(0)` is forbidden (undefined handle -> reverts with `UndefinedHandle`)
2. **Same type** — you can't add a `euint256` with a `euint16` (-> reverts with `IncompatibleTypes`)
3. **Authorized** — the caller must have ACL access on each operand (-> reverts with `NotAllowed`)

---

## The INoxCompute Interface

The `INoxCompute.sol` interface is the **contract** between NoxCompute and every contract that calls it. It defines:

### The `Operator` Enum — The Operation Catalog

```solidity
enum Operator {
    WrapAsPublicHandle,  // Convert a public value into a handle
    Add, Sub, Mul, Div,  // Basic arithmetic
    SafeAdd, SafeSub, SafeMul, SafeDiv,  // Arithmetic with success flag
    Select,              // Encrypted if/else
    Eq, Ne, Lt, Le, Gt, Ge,  // Comparisons
    Transfer, Mint, Burn // Composite token operations
}
```

This enum is **critical**: it's encoded into every generated handle. The Runner (TEE) knows which operation to execute by reading the emitted event, which contains the operator.

### Events — The Nervous System

Every compute function emits an **event** containing:
- `caller` — who requested the operation (e.g., the cToken contract)
- The operands — the input handles
- The `result` — the output handle

```solidity
event Add(
    address indexed caller,
    bytes32 leftHandOperand,
    bytes32 rightHandOperand,
    bytes32 result
);
```

**Why does this matter?** Because this is how the Runner (TEE) learns it has work to do. The pipeline is:

```
NoxCompute emits event  ->  Ingestor picks it up  ->  NATS routes it  ->  Runner executes it
```

Without the event, the TEE doesn't know a computation was requested. The result handle already exists on-chain (it's deterministic), but the **encrypted value** only exists once the Runner has processed the event.

### The 3 Internal Computation Patterns

The contract implements 3 internal patterns, depending on the operation type:

| Pattern | Functions | Inputs | Outputs | Result type |
|---|---|---|---|---|
| `_executeArithmeticOperation` | add, sub, mul, div, safe* | 2 handles | 1 result (+ 1 flag if safe) | Same type as inputs |
| `_executeComparisonOperation` | eq, ne, lt, le, gt, ge | 2 handles | 1 result | Always `Bool` |
| `_executeCompositeOperation` | transfer, mint, burn | 3 handles | 3 results (flag + 2 handles) | Flag `Bool` + same type |

---

## Why Do mint and burn Live in NoxCompute (Not in ERC-7984)?

This is **the** key architectural question. The answer is one word: **separation of concerns**.

### The Problem

In a standard ERC-20, `mint()` does two things:
1. **Computes** new balances (`balance += amount`, `totalSupply += amount`)
2. **Stores** the results (updates the mappings)

In a confidential system, the contract **cannot compute** — the values are encrypted. It only sees handles. Only the TEE can do the math.

### The Nox Solution: Separate Calculator from Accountant

```
+-----------------------------+     +------------------------------+
|      cToken (ERC-7984)      |     |        NoxCompute            |
|      = the ACCOUNTANT       |     |      = the CALCULATOR        |
|                             |     |                              |
|  "I know WHO owns           |     |  "I know HOW to compute      |
|   which handle"             |     |   on handles"                |
|                             |     |                              |
|  - Stores balances          |     |  - Checks ACL                |
|    (mapping address->handle)|     |  - Generates handles         |
|  - Enforces business rules  |     |  - Emits events              |
|    (allowance, etc.)        |     |  - Has no concept of         |
|  - Manages approve/allowance|     |    "token" or "balance"      |
|  - Calls NoxCompute         |     |                              |
|    for computation          |     |                              |
+-----------------------------+     +------------------------------+
```

### Concretely, Here's What Happens During a `wrap(to, 100)`:

```
1. cToken.wrap(alice, 100)
   |
   +-- cToken transfers 100 public RLC (standard ERC-20)
   |
   +-- cToken calls NoxCompute.mint(
   |       balanceTo = alice.balanceHandle,   // Alice's current handle
   |       amount = publicHandle(100),         // 100 converted to a public handle
   |       totalSupply = totalSupplyHandle     // current supply
   |   )
   |
   |   NoxCompute does:
   |   +-- Checks ACL on all 3 handles
   |   +-- Generates 3 new handles (success, newBalance, newSupply)
   |   +-- Emits Mint event
   |   +-- Returns (successHandle, newBalanceHandle, newSupplyHandle)
   |
   +-- cToken stores the new balance handle for Alice
   +-- cToken stores the new supply handle
   +-- cToken manages ACL (allow for Alice and for itself)
```

### Why `mint` in NoxCompute Is NOT a "Token Mint"

`NoxCompute.mint()` doesn't create tokens. It doesn't even know what a token is. It's a **composite math operation** that does:

```
Input:  (balance, amount, supply)
Output: if balance + amount AND supply + amount don't overflow:
           -> (true, balance + amount, supply + amount)
        else:
           -> (false, balance unchanged, supply unchanged)
```

It's the equivalent of calling `safeAdd(balance, amount)` + `safeAdd(supply, amount)` + checking both succeeded — but in **a single atomic operation** (1 event, 1 TEE computation).

Similarly:
- **`NoxCompute.burn()`** = atomic `safeSub(balance, amount)` + `safeSub(supply, amount)`
- **`NoxCompute.transfer()`** = atomic `safeSub(from, amount)` + `safeAdd(to, amount)` with silent cap

### The Benefit

| Approach | Events emitted | TEE computations | Gas |
|---|---|---|---|
| Manual: `safeAdd` + `safeAdd` + `select` + `select` | 4 | 4 | High |
| Atomic: `mint` | 1 | 1 | Low |

And most importantly: composite operations handle the **silent cap** (if it overflows, everything stays unchanged) — impossible to reproduce correctly with manual `add`/`sub` without information leakage.

---

## The Handle Format (Generated by NoxCompute)

When NoxCompute generates a result handle, it builds a structured `bytes32`:

```
  Byte 0      Bytes 1-4      Byte 5     Byte 6      Bytes 7-31
+--------+---------------+----------+-----------+---------------------+
|Version |   Chain ID    | TEEType  |  Attrs    |  Hash (truncated)   |
|  0x00  |   421614      | Uint256  | 0x01=priv |  keccak256(...)     |
|        | (Arb Sepolia) |          | 0x00=pub  |                     |
+--------+---------------+----------+-----------+---------------------+
```

- **Version** — always 0 for now
- **Chain ID** — prevents reusing a handle from one chain on another
- **TEEType** — the result type (Bool, Uint256, Int16, etc.)
- **Attrs** — bit 0 = `isUniqueHandle`. If 0 -> public handle (no ACL). If 1 -> confidential handle
- **Hash** — derived from `keccak256(operator, operands, contractAddress, uniqueSeed, outputIndex)`

The hash is **deterministic**: the same inputs always produce the same handle. This allows the contract to return the handle immediately, before the TEE has even done the computation.

### Public Handle vs. Confidential Handle

```solidity
// PUBLIC handle -- same value + same type = same handle (deterministic, no ACL)
wrapAsPublicHandle(100, Uint256) -> always the same bytes32

// CONFIDENTIAL handle -- a counter guarantees uniqueness
add(handleA, handleB) -> unique handle on every call
```

Public handles are used to inject **constants** into computations. For example, to compare a balance to zero:

```solidity
bytes32 zero = NoxCompute.wrapAsPublicHandle(0, Uint256);  // public handle
bytes32 isZero = NoxCompute.eq(balance, zero);              // comparison
```

---

## Supported Types for Arithmetic

NoxCompute doesn't support all types for compute operations. Currently:

| Type | Supported | Typical usage |
|---|---|---|
| `Uint16` | Yes | Small counters, numeric flags |
| `Uint256` | Yes | Balances, amounts, prices |
| `Int16` | Yes | Short signed differences |
| `Int256` | Yes | Signed differences, PnL |
| `Bool` | No (output only) | Returned by comparisons and safe* ops |
| Others (`Uint8`, `Uint128`, ...) | No | Reverts with `UnsupportedArithmeticType` |

The `Bool` type is never an arithmetic operand — it's only produced by comparisons (`eq`, `gt`...) and safe operations (`safeAdd`...), and consumed by `select()`.

---

## The 3 Layers of Abstraction

To fully understand the architecture, you need to see the 3 levels:

```
Layer 3: Nox.sol (library SDK)
  -> Type-safe API for Solidity developers
  -> Nox.add(euint256 a, euint256 b) -> euint256
  -> Unwraps types, calls NoxCompute, re-wraps

Layer 2: NoxCompute.sol (singleton contract)
  -> Low-level API using bytes32 (raw handles)
  -> add(bytes32 a, bytes32 b) -> bytes32
  -> Checks ACL, generates handles, emits events

Layer 1: Runner (TEE, off-chain)
  -> Listens to events, decrypts, computes, re-encrypts
  -> The only component that ever sees plaintext values
```

A smart contract developer never calls `NoxCompute` directly — they use `Nox.sol`:

```solidity
import {Nox} from "@iexec-nox/contracts/sdk/Nox.sol";

// The developer writes:
euint256 result = Nox.add(balance, deposit);

// Nox.sol translates to:
// bytes32 rawResult = NoxCompute.add(
//     euint256.unwrap(balance),
//     euint256.unwrap(deposit)
// );
// return euint256.wrap(rawResult);
```

---

## Visual Summary

```
+---------------------------------------------------------------+
|                         NoxCompute                              |
|                    (1 instance per chain)                       |
|                                                                 |
|  +----------+  +---------------+  +--------------------------+ |
|  |   ACL    |  |   Compute     |  |   Proofs                 | |
|  |          |  |               |  |                          | |
|  | allow    |  | Arithmetic:   |  | validateInputProof       | |
|  | addViewer|  |  add sub mul  |  | validateDecryptionProof  | |
|  | isAllowed|  |  div + safe*  |  | wrapAsPublicHandle       | |
|  | ...      |  |               |  |                          | |
|  |          |  | Comparisons:  |  |                          | |
|  |          |  |  eq ne lt le  |  |                          | |
|  |          |  |  gt ge        |  |                          | |
|  |          |  |               |  |                          | |
|  |          |  | Composites:   |  |                          | |
|  |          |  |  select       |  |                          | |
|  |          |  |  transfer     |  |                          | |
|  |          |  |  mint burn    |  |                          | |
|  +----------+  +---------------+  +--------------------------+ |
|                                                                 |
|  Input: handles (bytes32)      Output: handles (bytes32)       |
|  NEVER sees plaintext values                                    |
|  Emits events -> Runner TEE does the actual computation        |
+---------------------------------------------------------------+
```

---

## Key Takeaways

1. **NoxCompute is the universal calculator.** Every computation on encrypted data goes through it — arithmetic, comparisons, and token operations (transfer/mint/burn).

2. **Operands are handles, never values.** NoxCompute only sees `bytes32`. The Runner (TEE) is the only component that ever sees plaintext values.

3. **mint/burn in NoxCompute != token mint/burn.** They are composite math primitives ("add A to B and to C in a single operation"). The cToken contract calls them for its business logic.

4. **Every operation = 1 event = 1 TEE computation.** Events are the bridge between on-chain and off-chain. No event, no computation.

5. **3 layers**: `Nox.sol` (type-safe for devs) -> `NoxCompute` (bytes32 + ACL + events) -> Runner (actual computation in the TEE).

6. **Handles are deterministic.** The contract can return the result handle immediately, even before the TEE has done the computation. The event triggers the computation asynchronously.

7. **The accountant/calculator separation** is fundamental. The cToken knows *who owns what*. NoxCompute knows *how to compute*. Neither one ever sees the actual amounts.

---

_Previous: [26 — The On-Chain Smart Contracts](./26-smart-contracts.md) | Back to [index](./README.md)_
