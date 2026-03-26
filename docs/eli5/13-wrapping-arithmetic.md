# Wrapping Arithmetic (ELI5)

> **TL;DR** — In Nox, `add` and `sub` don't crash on overflow — they wrap around silently, like a car odometer rolling past 999999 back to 000000. This sounds scary, but it's a *feature*: reverting would leak information about secret values.

---

## The Odometer Analogy

Your car's odometer has 6 digits and currently reads `999,998`.

- You drive 1 mile → `999,999`. Normal.
- You drive 1 more mile → `000,000`. It wrapped around!
- You drive 1 more mile → `000,001`.

The odometer didn't break. It didn't throw an error. It just... kept going, wrapping from the maximum value back to zero.

That's **wrapping arithmetic**. In Nox, `Nox.add()` and `Nox.sub()` behave the same way with 256-bit numbers.

---

## Why Standard Solidity Reverts on Overflow

In regular Solidity (since 0.8.0), arithmetic **reverts** on overflow:

```solidity
uint256 a = type(uint256).max;  // 2^256 - 1
uint256 b = a + 1;              // REVERTS! Transaction fails.
```

This is a safety feature for public smart contracts — it prevents bugs where balances accidentally wrap around.

---

## Why Nox Can't Revert

Here's the problem: in Nox, the values are **encrypted**. The smart contract doesn't know what the actual numbers are. It only sees handles.

If `Nox.add(a, b)` could revert, it would **leak information**:

```
Scenario: Alice tries to transfer 1000 cUSDC to Bob.

If the transaction REVERTS:
  → Everyone watching knows: "Alice's balance is less than 1000"
  → That's private information — leaked!

If the transaction SUCCEEDS (always):
  → Nobody learns anything about Alice's balance
  → Privacy preserved ✓
```

**Reverting on overflow reveals whether a condition was met.** In a confidential system, that's an information leak. So Nox uses wrapping arithmetic instead — the operation always succeeds, even if the result wraps around.

---

## What Wrapping Looks Like

### Addition (overflow)

```
  euint256 a = ...; // encrypted 2^256 - 1 (max value)
  euint256 b = ...; // encrypted 5

  euint256 result = Nox.add(a, b);
  // Inside TEE: (2^256 - 1) + 5 = 4 (wrapped around)
  // No revert, no error, no information leaked
```

### Subtraction (underflow)

```
  euint256 balance = ...; // encrypted 100
  euint256 amount = ...;  // encrypted 200

  euint256 result = Nox.sub(balance, amount);
  // Inside TEE: 100 - 200 = 2^256 - 100 (huge number, wrapped around)
  // No revert — an attacker can't deduce that balance < amount
```

---

## "But That's Dangerous!"

Yes — if you just use `Nox.add()` and `Nox.sub()` blindly, you could end up with nonsense values. That's where **safe arithmetic** and **`Nox.select()`** come in.

### Safe Arithmetic

Nox provides safe versions that return **two** values — the result and a success flag:

```solidity
(ebool success, euint256 result) = Nox.safeAdd(a, b);
// success = encrypted true/false (did it overflow?)
// result = the wrapped result
```

Both `success` and `result` are encrypted. Nobody can see whether it overflowed.

### The `select` Pattern

`Nox.select()` is like an encrypted if/else:

```solidity
// "If the addition succeeded, use the new value; otherwise keep the old one"
euint256 finalBalance = Nox.select(success, result, originalBalance);
```

This is the standard pattern for handling overflows in confidential contracts:

```solidity
// Safe deposit: only update balance if addition doesn't overflow
(ebool ok, euint256 newBal) = Nox.safeAdd(balance, deposit);
balance = Nox.select(ok, newBal, balance);
// If overflow → balance unchanged (silently rejected)
// If ok → balance updated
// Either way: no revert, no information leak
```

---

## Why Not Just Use Safe Arithmetic Everywhere?

You can! But there's a cost:

| Operation | Gas cost | Outputs | Off-chain computation |
|---|---|---|---|
| `Nox.add()` | Lower | 1 handle | 1 computation |
| `Nox.safeAdd()` | Higher | 2 handles (result + flag) | 2 computations |

For operations where you **know** overflow can't happen (e.g., adding small constants), wrapping `add` is cheaper. For user-facing operations (transfers, deposits), use `safeAdd` + `select`.

---

## The Transfer Example

Here's how `Nox.transfer()` (the atomic token operation) handles this internally:

```
Alice has 100 cUSDC. She tries to transfer 200.

Using wrapping arithmetic + internal capping:
  1. Check: is 200 ≤ 100? No.
  2. Silently cap: actual transfer = 0 (not 200)
  3. Alice's balance: still 100
  4. Bob's balance: unchanged
  5. Transaction succeeds — no revert, no leak

The protocol silently "caps" the transfer at the available balance,
preventing wrapping while preserving privacy.
```

This is why the token-level operations (`transfer`, `mint`, `burn`) are preferred over manual `add`/`sub` — they handle edge cases internally.

---

## Key Takeaways

1. **Wrapping arithmetic never reverts.** `Nox.add()` and `Nox.sub()` wrap around on overflow/underflow instead of failing.

2. **Reverting would leak information.** If a transaction fails because balance < amount, an observer learns something about the encrypted balance.

3. **Safe variants exist.** `Nox.safeAdd()` / `Nox.safeSub()` return an encrypted success flag alongside the result.

4. **`Nox.select()` is the encrypted if/else.** Use it with safe arithmetic to handle edge cases without leaking information.

5. **Token operations handle this for you.** `Nox.transfer()`, `Nox.mint()`, and `Nox.burn()` internally cap at available balances — no wrapping, no leaking.

---

*Next in the series: [14 — Token Operations](./14-token-operations.md)*
