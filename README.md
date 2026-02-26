# Confidential Token Demo

An interactive demo showcasing privacy-preserving token operations: **wrap**, **wrap transfer**, and **selective disclosure**.

---

## Overview

Confidential tokens allow users to transact with hidden amounts while still being able to prove properties about those transactions when needed. This demo walks through the three core operations:

| Operation | Description |
|---|---|
| **Wrap** | Convert a standard token into a confidential token, hiding its amount |
| **Wrap Transfer** | Transfer confidential tokens to another address without revealing the amount |
| **Selective Disclosure** | Reveal specific details of a confidential token to a chosen party |

---

## Operations

### 1. Wrap

Wrapping converts a plain token into a confidential token. The underlying amount is encrypted and hidden from public view, while a cryptographic commitment ensures the token remains valid and spendable.

**What happens:**
- A standard token balance is locked
- A confidential token is minted with an encrypted amount
- Only the owner can see the true value

---

### 2. Wrap Transfer

Wrap transfer lets you send confidential tokens to another address. The transferred amount stays hidden from everyone except the sender and recipient.

**What happens:**
- The sender's encrypted balance is debited
- The recipient receives a new confidential token with the transferred amount
- No on-chain observer can determine the transfer amount

---

### 3. Selective Disclosure

Selective disclosure lets a token holder prove specific facts about their confidential token — such as the balance or a transaction amount — to a designated verifier, without revealing anything else.

**What happens:**
- The holder generates a disclosure proof for a specific piece of information
- The verifier can confirm the disclosed data is accurate
- All other details remain private

---

## Getting Started

> Prerequisites and setup instructions will be added as the project is built out.

1. Clone the repository
2. Install dependencies
3. Run the demo

---

## License

MIT
