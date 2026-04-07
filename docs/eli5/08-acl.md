# Access Control Lists — ACL (ELI5)

> **TL;DR** — Every handle has a permission list that controls who can use it in computations and who can decrypt its value. Think of it like a guest list for a private event — your name has to be on the list, and your badge determines what you can do.

---

## The VIP Event Analogy

Imagine a private art gallery showing. Each painting (handle) has its own guest list with different badge types:

| Badge color                    | What you can do                                                           | ACL equivalent                                    |
| ------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| 🟡 **Gold badge** (Admin)      | View the painting, move it to another room, decide who else gets a badge  | Use handle in computations + manage permissions   |
| 🔵 **Blue badge** (Viewer)     | View the painting, but can't move it or invite others                     | Decrypt the value, but can't use it in operations |
| ⚪ **White badge** (Transient) | View the painting once during this event only — badge expires at the door | One-time use within a single transaction          |
| 🟢 **Green badge** (Public)    | Anyone walking by can look through the window                             | Anyone can decrypt — no permission needed         |

---

## The Four Permission Levels

### 1. Admin — `Nox.allow(handle, address)`

Admins can:

- **Use the handle as input** to computations (`Nox.add()`, `Nox.sub()`, etc.)
- **Grant admin access** to other addresses
- **Add viewers** for the handle

This is the most powerful permission. Typically, the **smart contract itself** and the **handle creator** are admins.

```solidity
// The contract grants itself admin access to the result
Nox.allow(newBalance, address(this));

// The contract grants the user admin access
Nox.allow(newBalance, msg.sender);
```

### 2. Viewer — `ACL.addViewer(handle, address)`

Viewers can:

- **Decrypt** the handle's value via the JS SDK

Viewers cannot:

- Use the handle in computations
- Grant access to others

This is the permission used for **selective disclosure** — letting an auditor, regulator, or partner see a value without giving them any control over it.

```solidity
// Let an auditor decrypt this balance
ACL.addViewer(balanceHandle, auditorAddress);
```

### 3. Transient — Automatic (no explicit call)

TOLEARN: je ne comprends pas pourquoi le smart contarct a besoin d'un accès temporaire

When `NoxCompute` processes an operation like `Nox.add(a, b)`, it automatically grants **transient access** to the result handle for the calling contract. This access:

- Is valid **only during the current transaction**
- Costs **zero gas** (no storage write)
- Is **cleared after the transaction ends**

This is a gas optimization. The contract gets temporary access to use the result handle within the same transaction, but must explicitly call `Nox.allow()` to keep it beyond that.

### 4. Public — `ACL.allowPublicDecryption(handle)`

When enabled, **anyone** can decrypt the handle's value — no ACL check needed. This is useful for values that should be readable by all, like a token's total supply.

```solidity
// Make the total supply publicly readable
ACL.allowPublicDecryption(totalSupplyHandle);
```

---

## How Permissions Flow

Here's what happens during a typical wrap operation:

```
1. User calls wrap(handle_100, proof)

2. Contract calls Nox.fromExternal(handle_100, proof)
   └── NoxCompute validates proof
   └── NoxCompute grants TRANSIENT access to contract for handle_100

3. Contract calls Nox.add(balance, handle_100)
   └── NoxCompute checks: does contract have access to both handles? ✓
   └── NoxCompute creates result_handle
   └── NoxCompute grants TRANSIENT access to contract for result_handle

4. Contract calls Nox.allow(result_handle, address(this))
   └── PERSISTENT admin access → contract can use this handle in future txs

5. Contract calls Nox.allow(result_handle, msg.sender)
   └── PERSISTENT admin access → user can use this handle later

6. Transaction ends
   └── All TRANSIENT access is cleared
   └── Only PERSISTENT access remains
```

---

## The Transient Trap

This is a common mistake for developers new to Nox:

```solidity
// ❌ BUG: This handle becomes inaccessible after the transaction!
function deposit(externalEuint256 amount, bytes calldata proof) external {
    euint256 verified = Nox.fromExternal(amount, proof);
    balance = Nox.add(balance, verified);
    // Forgot to call Nox.allow(balance, address(this))!
    // After this tx, the contract has NO access to the new balance handle.
}
```

```solidity
// ✅ CORRECT: Persist access before the transaction ends
function deposit(externalEuint256 amount, bytes calldata proof) external {
    euint256 verified = Nox.fromExternal(amount, proof);
    balance = Nox.add(balance, verified);
    Nox.allow(balance, address(this));  // Contract keeps access
    Nox.allow(balance, msg.sender);     // User can decrypt
}
```

---

## Checking Permissions

You can verify permissions on-chain or off-chain:

```solidity
// On-chain: check if an address is a viewer
bool canView = ACL.isViewer(handle, someAddress);

// On-chain: check if an address has admin access
bool canUse = ACL.isAllowed(handle, someAddress);
```

From the JS SDK:

```typescript
const acl = await handleClient.viewACL(handle);
// Returns permission details for the handle
```

---

## Permission Comparison

|                        | Admin         | Viewer            | Transient       | Public                        |
| ---------------------- | ------------- | ----------------- | --------------- | ----------------------------- |
| **Use in computation** | Yes           | No                | Yes (one tx)    | No                            |
| **Decrypt value**      | No\*          | Yes               | No              | Yes (everyone)                |
| **Grant permissions**  | Yes           | No                | No              | N/A                           |
| **Persistence**        | Permanent     | Permanent         | One transaction | Permanent                     |
| **Gas cost**           | Storage write | Storage write     | Free            | Storage write                 |
| **Granted by**         | `Nox.allow()` | `ACL.addViewer()` | Automatic       | `ACL.allowPublicDecryption()` |

\*Admins can add themselves as viewers separately.

---

## Key Takeaways

1. **Every handle has its own ACL.** Permissions are per-handle, not per-token or per-contract.

2. **Four levels**: Admin (compute + manage), Viewer (decrypt only), Transient (one-tx use), Public (everyone decrypts).

3. **Transient access is automatic but temporary.** Always call `Nox.allow()` to persist access before the transaction ends.

4. **Viewers can't compute.** Giving someone viewer access lets them _see_ a value, not _use_ it in operations. This is the basis for selective disclosure.

5. **Viewer access is permanent and irrevocable** (in the current protocol version). Once granted, it cannot be taken back for that specific handle.

---

_Next in the series: [09 — Transient vs. Persistent Access](./09-transient-vs-persistent.md)_
