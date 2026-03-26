# Selective Disclosure (ELI5)

> **TL;DR** — You can let specific people see your private data without making it public. It's like giving a specific doctor permission to read your medical file — they can see it, but the rest of the world can't.

---

## The Medical Records Analogy

Your medical records are private. But sometimes you *need* someone to see them:

- Your **new doctor** needs your history to treat you properly
- Your **insurance company** needs to verify a claim
- A **researcher** needs anonymized data for a study

You don't publish your records on a billboard. You give **specific people** access to **specific records**. That's selective disclosure.

In Nox, it works the same way:

| Medical world | Nox equivalent |
|---|---|
| Your medical file | A handle (e.g., your cUSDC balance) |
| Giving your doctor access | `addViewer(balanceHandle, doctorAddress)` |
| The doctor reads your file | Doctor calls `decrypt(balanceHandle)` via SDK |
| Random stranger tries to read | Handle Gateway checks ACL → denied |

---

## Why Selective Disclosure Matters

### Compliance and Auditing

A DeFi fund manages confidential positions. A regulator says: "Prove you hold sufficient collateral." With selective disclosure:

1. The fund grants the regulator **viewer access** to their collateral handle.
2. The regulator decrypts and verifies the amount.
3. Nobody else sees anything. The fund's strategy stays private.

### Enterprise Adoption

A company wants to pay employees in confidential tokens. The payroll is private, but:

- The **CFO** needs to see total outflows → viewer access on the treasury handle
- The **auditor** needs to verify transactions → viewer access on specific transfer handles
- **Employees** see only their own salary → viewer access on their individual balance handles

### Trust Between Parties

Alice and Bob are doing a deal. Alice's balance proves she can cover the deal, but she doesn't want Bob to know her total wealth. She can:

1. Grant Bob viewer access to a *specific* handle (e.g., an escrow balance)
2. Bob verifies the amount
3. Bob has no access to Alice's main balance handle

---

## How It Works

### Granting Viewer Access

From a smart contract:

```solidity
// Grant the auditor permission to decrypt this specific handle
ACL.addViewer(balanceHandle, auditorAddress);
```

From the JS SDK (via a contract call):

```typescript
// The contract exposes a function that calls ACL.addViewer internally
await contract.grantViewerAccess(handleBytes, auditorAddress);
```

### Decrypting as a Viewer

The viewer uses the JS SDK:

```typescript
const handleClient = await createViemHandleClient(walletClient);
const { value } = await handleClient.decrypt(balanceHandle);
// value = 50000n (the decrypted balance)
```

The flow is identical to the owner's decryption — EIP-712 signature, ACL check, KMS delegation, local decryption. The only difference is that the ACL check verifies the viewer's address instead of the owner's.

---

## Important: Per-Handle, Not Per-Token

This is a critical nuance. Viewer access is granted **per handle**, not per token or per account.

```
Transaction 1: Alice has handle_A (balance: 1000 cUSDC)
  → Alice grants auditor viewer access to handle_A ✓
  → Auditor can decrypt handle_A → sees 1000

Transaction 2: Alice wraps 500 more cUSDC
  → New balance handle: handle_B (balance: 1500 cUSDC)
  → Auditor still has access to handle_A → sees 1000 (stale!)
  → Auditor has NO access to handle_B → cannot see 1500

  → Alice must grant access to handle_B separately
```

**Why?** Because handles are ephemeral — every operation creates a new handle. The old handle still exists (and the viewer can still decrypt it), but it no longer represents the current balance.

This means:
- Viewer access to a **balance handle** must be **re-granted after every transaction** that changes the balance
- Viewer access is a **snapshot**, not a subscription

---

## The Access Matrix

| Scenario | Can decrypt? | Why |
|---|---|---|
| Owner decrypts own handle | Yes | Owner is automatically an admin/viewer |
| Viewer decrypts granted handle | Yes | Explicitly added via `addViewer` |
| Viewer decrypts *new* handle (after a tx) | No | New handle, new ACL — access not re-granted |
| Random address decrypts | No | Not on the ACL |
| Anyone decrypts a public handle | Yes | `allowPublicDecryption` was called |

---

## Current Limitations

In the current version of the protocol:

1. **No revocation**: Once you grant viewer access, you can't take it back for that handle. (But since handles change with every transaction, the viewer naturally loses access to *current* data.)

2. **No viewer listing**: There's no built-in way to list all viewers of a handle. You can check if a specific address is a viewer with `isViewer(handle, address)`.

3. **Manual re-granting**: For ongoing access (e.g., a permanent auditor), the contract must re-grant viewer access after every balance-changing operation.

---

## Key Takeaways

1. **Selective disclosure = viewer access to specific handles.** You choose exactly who sees what.

2. **It's per-handle, not per-token.** A new transaction creates a new handle with a fresh ACL. Viewers must be re-granted.

3. **Viewer access is read-only.** Viewers can decrypt a value but can't use the handle in computations or grant access to others.

4. **Decryption is gasless.** Viewers use EIP-712 signatures — no on-chain transaction needed to read a value.

5. **Use cases**: compliance (regulator audits), enterprise (CFO visibility), trust (proving solvency to a counterparty).

---

*Next in the series: [11 — ERC-7984 (Confidential Tokens)](./11-erc-7984.md)*
