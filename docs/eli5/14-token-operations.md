# Token Operations — Transfer, Mint, Burn (ELI5)

> **TL;DR** — Instead of doing multiple separate math operations (subtract from sender, add to receiver), Nox provides single atomic operations that handle everything in one shot — fewer events, less gas, and built-in overflow protection.

---

## The Assembly Line Analogy

Imagine you're moving boxes between two warehouses. You could do it step by step:

1. Count boxes in Warehouse A
2. Remove 50 boxes from A
3. Count boxes in Warehouse B
4. Add 50 boxes to B
5. Update both inventory sheets

That's 5 steps, 5 chances for something to go wrong.

Or you could use a **single forklift operation** that moves the boxes and updates both inventories at once. One step, one record, done.

Nox's token operations are the forklift.

---

## Why Atomic Operations?

In a confidential system, every operation emits an on-chain event that the Runner must process off-chain. If a transfer required three separate calls:

```solidity
// ❌ Manual approach: 3 operations, 3 events, 3 off-chain computations
euint256 newSenderBal = Nox.sub(senderBalance, amount);
euint256 newReceiverBal = Nox.add(receiverBalance, amount);
ebool isValid = Nox.ge(senderBalance, amount);
```

That's 3 events emitted, 3 messages in NATS, 3 Runner executions. Each one costs gas and processing time.

With the atomic `transfer`:

```solidity
// ✅ Atomic approach: 1 operation, 1 event, 1 off-chain computation
(euint256 newAmount, euint256 newSenderBal, euint256 newReceiverBal) =
    Nox.transfer(amount, senderBalance, receiverBalance);
```

**One event, one computation.** The Runner handles everything internally.

---

## The Three Token Operations

### Transfer

Moves an amount from one balance to another.

**Inputs** (3 handles):
| Handle | Description |
|---|---|
| `amount` | How much to transfer (encrypted) |
| `fromBalance` | Sender's current balance (encrypted) |
| `toBalance` | Receiver's current balance (encrypted) |

**Outputs** (3 handles):
| Handle | Description |
|---|---|
| `actualAmount` | The amount actually transferred (may be capped) |
| `newFromBalance` | Sender's new balance |
| `newToBalance` | Receiver's new balance |

**Inside the TEE:**

```
If amount ≤ fromBalance:
    actualAmount = amount
    newFromBalance = fromBalance - amount
    newToBalance = toBalance + amount
Else:
    actualAmount = 0          ← silently capped
    newFromBalance = fromBalance  ← unchanged
    newToBalance = toBalance      ← unchanged
```

### Mint

TOLEARN: mint et burn sont uniquement pour le cToken smart contract

Creates new tokens and adds them to a balance, updating total supply.

**Inputs** (3 handles):
| Handle | Description |
|---|---|
| `amount` | How many tokens to mint (encrypted) |
| `toBalance` | Recipient's current balance (encrypted) |
| `totalSupply` | Current total supply (encrypted) |

**Outputs** (3 handles):
| Handle | Description |
|---|---|
| `actualAmount` | The amount actually minted (may be capped if supply overflows) |
| `newToBalance` | Recipient's new balance |
| `newTotalSupply` | Updated total supply |

### Burn

Destroys tokens from a balance, updating total supply.

**Inputs** (3 handles):
| Handle | Description |
|---|---|
| `amount` | How many tokens to burn (encrypted) |
| `fromBalance` | Holder's current balance (encrypted) |
| `totalSupply` | Current total supply (encrypted) |

**Outputs** (3 handles):
| Handle | Description |
|---|---|
| `actualAmount` | The amount actually burned (capped at balance) |
| `newFromBalance` | Holder's new balance |
| `newTotalSupply` | Updated total supply |

---

## The Silent Cap

All three operations share a critical behavior: **they never fail, they silently cap**.

```
Alice has 100 cUSDC. She tries to transfer 500.

Manual approach (Nox.sub):
  100 - 500 = wraps around to a huge number ← BUG!

Atomic transfer:
  500 > 100 → cap transfer at 0
  Alice keeps 100, Bob gets nothing
  Transaction succeeds, no information leaked ✓
```

**Why not revert?** Because reverting on "insufficient balance" reveals that the balance is less than the attempted amount — an information leak in a confidential system.

**Why not actually transfer 100 (the max)?** Because that would reveal the exact balance. Capping at 0 means an observer learns nothing — the transaction looks identical whether Alice had 0 or 99 tokens.

---

## Gas and Computation Comparison

| Approach                                 | Events emitted | Runner computations | Gas cost |
| ---------------------------------------- | -------------- | ------------------- | -------- |
| Manual (`sub` + `add` + `ge` + `select`) | 4              | 4                   | Higher   |
| Atomic (`transfer`)                      | 1              | 1                   | Lower    |
| Manual (`add` + `add` for mint)          | 2              | 2                   | Medium   |
| Atomic (`mint`)                          | 1              | 1                   | Lower    |

The atomic operations are always more efficient because they batch everything into a single event and a single Runner execution.

---

## Handle Validation

The Runner enforces strict rules:

- All **input handles must exist** (have encrypted data behind them)
- All **output handles must not exist** (they're new)
- If validation fails, the Runner rejects the message

This prevents replay attacks (reusing old handles) and ensures every computation produces fresh results.

---

## Key Takeaways

1. **Three atomic operations**: `transfer` (move tokens), `mint` (create tokens), `burn` (destroy tokens). Each takes 3 input handles and produces 3 output handles.

2. **Silent capping, never reverting.** If a transfer exceeds the balance, the actual amount is capped to 0. No revert, no information leak.

3. **One operation = one event = one computation.** Far more efficient than chaining manual `add`/`sub` calls.

4. **Use atomic operations for tokens.** Reserve manual `Nox.add()`/`Nox.sub()` for non-token computations where you control the math.

5. **All computation happens in the TEE.** The smart contract sees handles in and handles out. The Runner does the actual math privately.

---

_Next in the series: [15 — The Protocol Architecture](./15-protocol-architecture.md)_
