# Transient vs. Persistent Access (ELI5)

> **TL;DR** — When a Nox computation creates a new handle, the contract gets a temporary pass (transient access) that expires at the end of the transaction. If you don't explicitly save it as a permanent pass (persistent access), you lose the ability to use that handle forever.

---

## The Conference Badge Analogy

You're at a tech conference. There are two kinds of badges:

| Badge type | What it does | Nox equivalent |
|---|---|---|
| **Day pass** (sticker on your shirt) | Gets you into sessions today. At the end of the day, security takes it back. | **Transient access** — works during this transaction only |
| **Registered badge** (laminated, in the system) | Gets you in every day of the conference. Your name is in the database. | **Persistent access** — stored on-chain, works forever |

When NoxCompute creates a result handle, it gives your contract a **day pass**. If you want to come back tomorrow (use that handle in a future transaction), you need to register for a **real badge** before the day ends.

---

## Why Two Levels?

You might wonder: "Why not just give persistent access automatically?" Two reasons:

### 1. Gas Savings

Persistent access requires a **storage write** on-chain (`SSTORE`), which costs gas. Transient access uses **transient storage** (`TSTORE`), which is much cheaper because it's cleared automatically at the end of the transaction.

In a complex operation that creates multiple intermediate handles (e.g., a `transfer` that involves several internal computations), most intermediate handles are **never needed again**. Giving them all persistent access would waste gas on storage writes that serve no purpose.

### 2. Separation of Concerns

NoxCompute is a **low-level computation engine**. It shouldn't decide which handles your application needs long-term — that's your contract's job. By defaulting to transient access, NoxCompute says: "Here's your result. You decide what to keep."

---

## The Timeline

Here's what happens during a single transaction:

```
Transaction starts
│
├── Nox.add(a, b) → result_1
│   └── Contract gets TRANSIENT access to result_1 ✓
│
├── Nox.sub(result_1, c) → result_2
│   └── Contract uses result_1 (transient still valid) ✓
│   └── Contract gets TRANSIENT access to result_2 ✓
│
├── Nox.allow(result_2, address(this))
│   └── Contract gets PERSISTENT access to result_2 ✓
│
├── balance = result_2  (stored in contract state)
│
Transaction ends
│
├── All TRANSIENT access is cleared
│   └── result_1 transient access → gone
│   └── result_2 transient access → gone (but persistent remains)
│
├── Persistent access survives:
│   └── result_2 → contract has permanent access ✓
```

In the next transaction, the contract can use `result_2` (persistent access), but `result_1` is gone — the contract has no way to use it anymore.

---

## The Common Mistake

This is the #1 bug for new Nox developers:

```solidity
// ❌ BROKEN: balance handle becomes inaccessible
function deposit(externalEuint256 amount, bytes calldata proof) external {
    euint256 verified = Nox.fromExternal(amount, proof);
    balance = Nox.add(balance, verified);
    // Transaction ends → transient access cleared
    // Next tx: contract tries to use `balance` → DENIED
}
```

The fix is simple — one line:

```solidity
// ✅ FIXED: persist access before transaction ends
function deposit(externalEuint256 amount, bytes calldata proof) external {
    euint256 verified = Nox.fromExternal(amount, proof);
    balance = Nox.add(balance, verified);
    Nox.allow(balance, address(this));  // ← this line saves you
}
```

---

## The Rule of Thumb

> **If you store a handle in contract state, you must `Nox.allow()` it for the contract.**

It's that simple. Every time you write `someVariable = Nox.someOperation(...)`, follow it with `Nox.allow(someVariable, address(this))`.

And if a user should be able to decrypt the value later, also call `Nox.allow(someVariable, msg.sender)`.

---

## Side-by-Side Comparison

| | Transient | Persistent |
|---|---|---|
| **How it's granted** | Automatic (by NoxCompute) | Explicit (`Nox.allow()`) |
| **Lifetime** | Current transaction only | Forever |
| **Gas cost** | Very low (transient storage) | Higher (permanent storage write) |
| **Use case** | Intermediate computation results | Final values stored in contract state |
| **Survives transaction end?** | No | Yes |
| **Can be used in future txs?** | No | Yes |

---

## Key Takeaways

1. **Transient access is a freebie.** NoxCompute gives it automatically for every result handle. It's cheap and temporary.

2. **Persistent access must be explicit.** Call `Nox.allow(handle, address(this))` before the transaction ends, or lose the handle.

3. **The rule is simple**: if a handle gets stored in state → persist its access. If it's just an intermediate value in a computation → transient is fine.

4. **This design saves gas.** Only the handles you actually need long-term pay the storage cost.

5. **Forgetting to persist is the most common Nox bug.** When debugging "access denied" errors on handles you know exist, check whether `Nox.allow()` was called.

---

*Next in the series: [10 — Selective Disclosure](./10-selective-disclosure.md)*
