# Wrap & Unwrap (ELI5)

> **TL;DR** — Wrapping is like exchanging cash for casino chips. You hand over public tokens, and you get confidential tokens at a 1:1 ratio. Unwrapping is cashing out — you burn the chips and get your public tokens back.

---

## The Casino Chips Analogy

When you enter a casino:

1. You go to the **cashier window** (the wrapper contract).
2. You hand over **$100 cash** (100 USDC, a public ERC-20 token).
3. The cashier locks your cash in the **vault** (the smart contract holds it).
4. You receive **$100 in chips** (100 cUSDC, a confidential ERC-7984 token).

Inside the casino, nobody can see how much cash you came in with. They only see chips moving around — and the chip values are encrypted.

When you leave:

1. You return your chips to the cashier.
2. The cashier **burns the chips** (destroys the confidential tokens).
3. You get your cash back.

The ratio is always **1:1**. 100 USDC in = 100 cUSDC out. No fees, no slippage, no exchange rate.

---

## The Wrap Flow

Here's what happens when you wrap 100 USDC into cUSDC:

```
Step 1: APPROVE
   You → USDC contract
   "Allow the wrapper contract to spend 100 USDC on my behalf"
   (Standard ERC-20 approve — exact amount, not infinite)

Step 2: ENCRYPT
   You (SDK) → Handle Gateway
   "Encrypt the value 100"
   ← Returns: handle_100 + proof

Step 3: WRAP
   You → Wrapper contract
   "wrap(handle_100, proof)"

   Inside the contract:
   a. Transfer 100 USDC from you to the contract (locked)
   b. Verify the handle proof
   c. Nox.add(yourConfidentialBalance, handle_100) → new balance handle
   d. Nox.allow(newBalance, contract) — persist access
   e. Nox.allow(newBalance, you) — let you decrypt

Step 4: COMPUTE (off-chain)
   Runner decrypts, computes 0 + 100 = 100, encrypts result

Step 5: DONE
   Your public USDC balance: decreased by 100
   Your confidential cUSDC balance: increased by 100 (encrypted)
```

---

## The Unwrap Flow

Unwrapping is the reverse — burn confidential tokens, get public tokens back:

```
Step 1: ENCRYPT
   You (SDK) → Handle Gateway
   "Encrypt the value 50" (the amount you want to unwrap)
   ← Returns: handle_50 + proof

Step 2: UNWRAP
   You → Wrapper contract
   "unwrap(handle_50, proof)"

   Inside the contract:
   a. Verify the handle proof
   b. Nox.sub(yourConfidentialBalance, handle_50) → new balance handle
   c. Nox.allow(newBalance, contract)
   d. Nox.allow(newBalance, you)

   After off-chain computation confirms the subtraction:
   e. Transfer 50 USDC from the contract back to you (unlocked)

Step 3: DONE
   Your confidential cUSDC balance: decreased by 50
   Your public USDC balance: increased by 50
```

---

## Why Exact Approval?

You might notice that Nox uses **exact amount approval**, not infinite approval:

```solidity
// ✅ Nox way: approve only what you need
approve(wrapperContract, 100);

// ❌ NOT the Nox way: infinite approval
approve(wrapperContract, type(uint256).max);
```

This is a deliberate security choice. Infinite approvals mean a compromised or malicious contract could drain your entire balance. Exact approval limits the damage to exactly the amount you intended to wrap.

---

## The 1:1 Invariant

The wrapper contract maintains a strict invariant:

```
Total public tokens locked = Total confidential tokens in circulation
```

This means:
- Every cUSDC in existence is backed by exactly 1 USDC locked in the contract
- You can always unwrap back to public tokens — the backing is there
- No fractional reserve, no yield, no risk — it's a pure 1:1 lock/unlock

---

## What Happens to the Locked Tokens?

The public tokens (USDC) you wrap aren't destroyed. They sit in the wrapper contract, waiting. From the outside, you can see:

- The wrapper contract's USDC balance (public — it's a regular ERC-20)
- This tells you the **total value wrapped** across all users

But you **cannot** see individual wrapped amounts, because those are represented by confidential balance handles.

---

## The Multi-Step Transaction

Both wrap and unwrap involve **multiple on-chain steps**:

| Step | Wrap | Unwrap |
|---|---|---|
| 1 | Approve ERC-20 spending | Encrypt unwrap amount |
| 2 | Encrypt wrap amount | Call unwrap on contract |
| 3 | Call wrap on contract | Wait for off-chain computation |
| 4 | Wait for off-chain computation | Receive public tokens back |

There's typically a **2-3 second cooldown** between steps because the off-chain TEE (NoxCompute) needs time to process. The UI shows a progress tracker to guide users through each step.

---

## Key Takeaways

1. **Wrap = lock public tokens, get confidential tokens.** Like exchanging cash for casino chips.

2. **Unwrap = burn confidential tokens, get public tokens back.** Like cashing out at the cashier.

3. **Always 1:1 ratio.** No fees, no slippage, no exchange rate. 100 USDC → 100 cUSDC, always.

4. **Exact approval only.** Security-first design — never approve more than needed.

5. **Multi-step process.** Approve → Encrypt → Submit → Wait for TEE. The UI guides you through it.

---

*Next in the series: [13 — Wrapping Arithmetic](./13-wrapping-arithmetic.md)*
