# Confidentiality vs. Anonymity (ELI5)

> **TL;DR** — Nox hides *what* you do (amounts, balances), not *who* you are (your wallet address). Think of it like a bank statement where every line says "transaction" but the dollar amounts are blacked out.

---

## The Confusion

People often use "privacy," "confidentiality," and "anonymity" as if they mean the same thing. They don't — and understanding the difference is key to understanding what Nox actually does.

---

## The Classroom Analogy

Imagine a classroom where the teacher hands back graded tests.

| Scenario | What's hidden | Real-world term |
|---|---|---|
| The teacher reads out each student's name **and** grade to the whole class | Nothing | Full transparency (traditional blockchain) |
| The teacher hands back tests face-down — everyone knows **who** got a test, but not **what** grade | The grade (the data) | **Confidentiality** (Nox) |
| Students wear masks — nobody knows **who** got which test, but grades are visible | The identity | **Anonymity** (Tornado Cash, Zcash) |
| Masks **and** face-down tests — nobody knows who got what | Both | Full privacy |

**Nox is the face-down test.** Everyone can see that your address made a transaction. They just can't see the amount, the balance, or any encrypted value involved.

---

## What Stays Visible on Nox

Even with Nox's confidential computing, the blockchain still shows:

- **Your wallet address** — everyone can see `0xAbCd...` called a function
- **The function called** — `wrap()`, `confidentialTransfer()`, `addViewer()` — the operation type is public
- **The contract address** — which token contract you interacted with
- **Gas fees** — how much you paid for the transaction
- **Timestamps** — when the transaction happened
- **Handles** — the 32-byte pointers are visible (but they reveal nothing about the underlying data)

---

## What Nox Hides

- **Balances** — your cUSDC balance is an opaque handle, not a readable number
- **Transfer amounts** — when you send cTokens, the amount is encrypted
- **Computation inputs and outputs** — any value processed through `Nox.add()`, `Nox.sub()`, etc.

---

## Why Not Full Anonymity?

You might wonder: "Why not hide everything?" A few reasons:

### 1. Composability

DeFi protocols need to call each other. If nobody knows which address is interacting, smart contracts can't enforce permissions, manage ACLs, or route tokens. Nox keeps addresses visible so that the existing DeFi ecosystem — wallets, explorers, indexers — keeps working.

### 2. Compliance

Institutions need to prove *who* transacted, even if the *amounts* stay private. Confidentiality lets a bank use DeFi while satisfying regulators: "Yes, we made this transaction. No, you can't see the amount — unless we grant you viewer access."

### 3. Simplicity

Anonymous systems require complex mechanisms (ring signatures, zero-knowledge proofs for identity, mixers). Nox's approach is simpler: standard Ethereum addresses, standard wallets, standard transactions — just with encrypted values.

---

## A Practical Example

Alice transfers 500 cUSDC to Bob. Here's what different observers see:

| Observer | Sees |
|---|---|
| **Random blockchain user** | `0xAlice` called `confidentialTransfer()` on cUSDC contract. Two handles were involved. That's it. |
| **Alice** (sender) | She knows she sent 500 cUSDC to Bob — she initiated it. |
| **Bob** (receiver) | He can decrypt his new balance handle and see the 500 arrived. |
| **An auditor** (viewer) | If Alice or Bob granted viewer access to the relevant handles, the auditor can decrypt and see the amounts too. |
| **Everyone else** | A transfer happened between two addresses. Amount: unknown. |

---

## Key Takeaways

1. **Confidentiality hides values.** Balances, amounts, and computation results are encrypted. Nobody can read them without permission.

2. **Anonymity hides identities.** Nox does *not* do this. Your wallet address is visible on every transaction.

3. **This is a feature, not a limitation.** Visible addresses enable composability, compliance, and compatibility with the existing Ethereum ecosystem.

4. **Selective disclosure bridges the gap.** With ACLs, you choose exactly who can see your private data — making confidentiality flexible rather than all-or-nothing.

---

*Next in the series: [03 — Why DeFi Transparency Is a Problem](./03-why-defi-transparency-is-a-problem.md)*
