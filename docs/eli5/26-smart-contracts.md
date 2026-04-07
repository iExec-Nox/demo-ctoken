# The On-Chain Smart Contracts (ELI5)

> **TL;DR** — Nox uses three types of on-chain contracts: standard ERC-20 tokens (public money), confidential token contracts / cTokens (the vault that hides your balances), and NoxCompute (the bouncer who controls who can peek inside the vault).

---

## The Bank Analogy

Imagine three buildings on the same street:

```
            THE NOX STREET
 ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
 │   REGULAR    │  │   CONFIDENTIAL   │  │    SECURITY      │
 │    BANK      │  │     VAULT        │  │     OFFICE       │
 │              │  │                  │  │                  │
 │  ERC-20      │  │  cToken          │  │  NoxCompute      │
 │  (RLC, USDC) │  │  (cRLC, cUSDC)   │  │  (ACL manager)   │
 │              │  │                  │  │                  │
 │  "Everyone   │  │  "Nobody sees    │  │  "I decide who   │
 │   can see    │  │   what's inside" │  │   gets to look"  │
 │   your       │  │                  │  │                  │
 │   balance"   │  │                  │  │                  │
 └──────────────┘  └──────────────────┘  └──────────────────┘
```

| Building           | Contract                 | Role                                           |
| ------------------ | ------------------------ | ---------------------------------------------- |
| Regular bank       | **ERC-20** (RLC, USDC)   | Public tokens — balances visible to everyone        |
| Confidential vault | **cToken** (cRLC, cUSDC) | Encrypted tokens — balances are opaque handles      |
| Calculator office  | **NoxCompute**           | Computation engine — ACL + arithmetic + token ops   |

---

## Contract 1: ERC-20 Tokens (The Regular Bank)

These are standard tokens on Arbitrum Sepolia. Nothing special — they're the public starting point.

```solidity
// Anyone can read Alice's balance
balanceOf(alice) → 1000   // visible to the whole world
```

In the demo, two ERC-20s are used:

- **RLC** — iExec's utility token
- **USDC** — a stablecoin

Their only role in the Nox flow is to be **wrapped** into confidential tokens. Think of them as cash you deposit at the vault's front desk.

---

## Contract 2: Confidential Token / cToken (The Vault)

This is where the magic happens. A cToken contract implements the **ERC-7984** standard — it looks like an ERC-20 to wallets and explorers, but all balances and transfer amounts are encrypted.

### The 5 Key Functions

TOLEARN: a quel moment on mint et on burn dans le smart contract

#### `wrap(to, amount)` — Deposit cash into the vault

You send public tokens in, you get confidential tokens back (1:1 ratio).

```
You:   "Here's 100 RLC"
Vault: *locks your 100 RLC, gives you a sealed envelope*
       "Your cRLC balance is now handle 0xab12..."
```

The amount is visible at deposit time (it's a public ERC-20 transfer), but once inside the vault, your balance becomes an opaque handle.

#### `confidentialBalanceOf(address)` — Check your sealed envelope

Returns a **handle** (bytes32), not a number. The handle is like a claim ticket — it doesn't tell you what's inside. To read the actual value, you need the Nox SDK to decrypt it off-chain.

```solidity
confidentialBalanceOf(alice) → 0xab12...f3e7   // means nothing without decryption
```

**Important:** The handle **changes after every transaction** (wrap, unwrap, transfer). It's ephemeral — like getting a new claim ticket each time.

#### `confidentialTransfer(to, encryptedAmount, proof)` — Send sealed envelopes

Transfer cTokens to someone without revealing the amount. The amount is encrypted before it hits the blockchain — nobody (not even validators) sees the actual number.

```
Alice: *encrypts "50" with SDK → gets handle + proof*
Alice → Vault: "Transfer this sealed amount to Bob"
Vault: *emits event, Runner processes off-chain*
Result: Alice's handle updated, Bob's handle updated
        Amount "50" was never visible on-chain
```

#### `unwrap(from, to, encryptedAmount, proof)` — Withdrawal request (step 1)

You ask to take tokens out of the vault. This is step 1 of a 2-step process because the TEE needs time to process.

```
You → Vault: "I want to withdraw this encrypted amount"
Vault: "OK, here's your withdrawal ticket (a new handle)"
```

#### `finalizeUnwrap(handle, decryptionProof)` — Complete withdrawal (step 2)

The TEE decrypts the amount and releases the public tokens back to you.

```
You → Vault: "Here's my ticket + the decryption proof"
Vault: *burns your cTokens, sends back public RLC*
You:   "I have my 100 RLC back!"
```

Why two steps? Because the vault can't read the encrypted amount by itself — it needs the TEE (NoxCompute/Runner pipeline) to process the decryption. There's a short delay (2-3 seconds) between the two calls.

---

## Contract 3: NoxCompute (The Universal Calculator)

NoxCompute is much more than a permission manager — it's the **computation engine** of the entire Nox protocol. It's a singleton proxy contract (one per chain) that serves as the single on-chain entry point for all operations on encrypted data.

### The 3 Roles of NoxCompute

#### Role 1: Access Control (ACL)

Manages who can use which handles in computations, and who can decrypt them:

- `allow(handle, account)` — grant admin access (can compute + manage permissions)
- `addViewer(handle, viewer)` — grant read-only access (can decrypt, can't compute)
- `allowPublicDecryption(handle)` — make a handle readable by everyone

#### Role 2: Computation Primitives

This is the part that's easy to miss. NoxCompute exposes a full set of **arithmetic, comparison, and composite operations** on encrypted data:

| Category | Functions | Returns |
|---|---|---|
| Arithmetic | `add`, `sub`, `mul`, `div` | 1 result handle (wrapping, no revert) |
| Safe arithmetic | `safeAdd`, `safeSub`, `safeMul`, `safeDiv` | 1 result + 1 success flag (Bool) |
| Comparisons | `eq`, `ne`, `lt`, `le`, `gt`, `ge` | 1 Bool handle |
| Control flow | `select(cond, a, b)` | 1 result (encrypted if/else) |
| Token ops | `transfer`, `mint`, `burn` | 1 success flag + 2 result handles |

Every function takes **handles** as input (not values) and returns **new handles**. The actual computation happens off-chain in the TEE — the contract just validates permissions, generates deterministic result handles, and emits events that the Runner picks up.

> For a deep dive into every function, operand rules, and the handle format, see [27 — NoxCompute Deep Dive](./27-noxcompute-deep-dive.md).

#### Role 3: Proof Validation

Verifies cryptographic proofs from the Handle Gateway:

- `validateInputProof(handle, owner, proof, type)` — checks that user-submitted encrypted input is authentic
- `validateDecryptionProof(handle, proof)` — checks that a decrypted result is authentic

### Why `mint` and `burn` Live Here (Not in the cToken)

In a normal ERC-20, `mint()` creates tokens and updates balances. But in Nox, the cToken can't do math — all its values are encrypted handles. So the work is split:

- **cToken (ERC-7984)** = the accountant — knows *who owns which handle*, manages approvals, calls NoxCompute
- **NoxCompute** = the calculator — knows *how to compute on handles*, doesn't know what a "token" is

`NoxCompute.mint(balance, amount, supply)` is not "create tokens". It's a math primitive: "add `amount` to `balance` and `supply` atomically, return success + new handles". The cToken calls it, then stores the new handles.

### Permissions Are Per-Handle

Since handles change after every transaction, viewer permissions don't automatically carry over:

```
1. Alice's balance handle = 0xab12...
2. Alice calls addViewer(0xab12..., auditor)     ← auditor can see
3. Alice receives a transfer → new handle = 0xcd34...
4. Auditor tries to decrypt 0xcd34...            ← DENIED (no permission)
5. Alice must call addViewer(0xcd34..., auditor)  ← auditor can see again
```

This is a feature, not a bug — it means old permissions automatically expire when your balance changes, giving you **forward secrecy** by default.

---

## How They Work Together

Here's a complete wrap + transfer + selective disclosure flow:

```
Step 1: WRAP (public → confidential)
────────────────────────────────────
Alice         ERC-20 (RLC)        cToken (cRLC)
  │               │                    │
  ├── approve ───>│                    │
  │               │                    │
  ├── wrap ───────┼──────────────────>│
  │               │  locks 100 RLC     │ mints cRLC
  │               │                    │ returns handle 0xab...
  │               │                    │

Step 2: TRANSFER (confidential → confidential)
──────────────────────────────────────────────
Alice         cToken (cRLC)       Bob
  │               │                │
  ├── encrypt 50 via SDK           │
  ├── confidentialTransfer ──────>│
  │               │ TEE processes   │
  │               │ off-chain...    │
  │               │                │ Bob gets new handle 0xef...
  │ new handle    │                │
  │ 0xcd...       │                │

Step 3: SELECTIVE DISCLOSURE
────────────────────────────
Bob           NoxCompute          Auditor
  │               │                  │
  ├── addViewer(0xef..., auditor) ─>│
  │               │ records ACL      │
  │               │                  │
  │               │    isViewer? ───>│ true
  │               │                  │
  │               │                  ├── decrypt via SDK
  │               │                  │   → sees Bob has 50 cRLC
```

---

## Deployed Addresses (Arbitrum Sepolia)

| Contract   | Address         | Type              |
| ---------- | --------------- | ----------------- |
| RLC        | `0x9923...C963` | ERC-20            |
| USDC       | `0x75fa...AA4d` | ERC-20            |
| cRLC       | `0x92b2...9af4` | ERC-7984 (cToken) |
| cUSDC      | `0x1cce...808e` | ERC-7984 (cToken) |
| NoxCompute | `0xd464...c229` | ACL proxy         |

---

## Key Takeaways

1. **Three contract types, clear roles.** ERC-20 = public money. cToken = encrypted vault. NoxCompute = access control.

2. **cToken is the core.** It handles wrap, unwrap, transfer, and balance queries — all with encrypted amounts represented as handles.

3. **NoxCompute is the computation engine, not just a bouncer.** It handles ACL *and* all arithmetic, comparisons, and token operations on encrypted data. See [27 — NoxCompute Deep Dive](./27-noxcompute-deep-dive.md) for the full picture.

4. **Unwrap is 2 steps** because the TEE needs time to decrypt. Wrap is 1 step because the input amount is already public.

5. **Permissions are ephemeral.** When your balance handle changes (after any tx), old viewer permissions expire automatically. You must re-grant access for the new handle.

6. **On-chain = coordination, off-chain = computation.** NoxCompute generates handles and emits events. The Runner (TEE) listens, decrypts, computes, and stores the encrypted results. The smart contracts never see plaintext values.

---

_Previous: [25 — RWA Token Standards & Nox](./25-rwa-token-standards.md) | Next: [27 — NoxCompute Deep Dive](./27-noxcompute-deep-dive.md) | Back to [index](./README.md)_
