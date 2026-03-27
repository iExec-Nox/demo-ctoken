# RWA Token Standards & Nox (ELI5)

> **TL;DR** — Three Ethereum standards are shaping how real-world assets go on-chain: ERC-3643 (regulated security tokens), ERC-4626 (vaults), and ERC-7540 (async vaults for illiquid assets). Each of them works today but leaks sensitive data on-chain. Nox's confidential layer can plug into all three to hide what the market shouldn't see — while keeping regulators in the loop.

---

## Why This Matters

Real-World Assets (RWA) are one of the fastest-growing segments in crypto. But tokenizing a bond, a real estate fund, or a private credit pool isn't just a technical problem — it's a **confidentiality** problem.

Today, if you tokenize a $50M real estate fund on Ethereum:
- Everyone sees the fund's total AUM (Assets Under Management)
- Everyone sees who invested and how much
- Everyone sees redemption timing and amounts
- Competitors see your LP base and can poach them

No serious fund manager will accept this. That's where these three standards — and Nox — intersect.

---

## ERC-3643: The Compliance Token

### What It Is

ERC-3643 (also called **T-REX** — Token for Regulated EXchanges) is the standard for **security tokens** that enforce regulatory compliance on-chain. It's the most widely adopted standard for tokenized securities, used by institutional issuers in Europe and beyond.

### How It Works

An ERC-3643 token has a built-in **identity and compliance layer**:

```
ERC-3643 Token
  │
  ├── Identity Registry
  │   └── Maps wallet addresses to verified identities
  │   └── "0xAlice is a French accredited investor"
  │
  ├── Compliance Module
  │   └── Rules enforced on every transfer
  │   └── "Max 100 holders", "Only EU residents", "Min investment 10k"
  │
  └── Standard ERC-20 interface
      └── balanceOf(), transfer(), etc.
```

Before any transfer happens, the contract checks:
1. Is the sender's identity verified? (KYC)
2. Is the receiver's identity verified?
3. Does this transfer comply with all rules?

If any check fails, the transfer reverts.

### The Problem: Everything Is Public

Here's what an ERC-3643 token looks like on a block explorer today:

```
Anyone can see:
  ✓ Alice holds 50,000 shares of "Paris Real Estate Fund"
  ✓ Alice's identity claim says she's an accredited investor
  ✓ Bob just bought 10,000 shares from Alice
  ✓ The fund has 87 holders
  ✓ Total supply is 1,000,000 shares worth $50M
```

The compliance works. But the **privacy** is zero. Every investor's position, every trade, every identity claim is visible to the entire world.

### What Nox Changes

Imagine wrapping an ERC-3643 token with Nox's confidential layer:

```
Today (ERC-3643):
  Identity Registry: "0xAlice = French accredited investor"  ← PUBLIC
  Balance: 50,000 shares                                     ← PUBLIC
  Transfer: Alice → Bob, 10,000 shares                       ← PUBLIC

With Nox (ERC-3643 + ERC-7984):
  Identity Registry: verified in TEE, not exposed on-chain    ← PRIVATE
  Balance: handle 0x7f4e... (encrypted)                       ← PRIVATE
  Transfer: Alice → Bob, handle 0xABC... (amount hidden)      ← PRIVATE

  Regulator calls decrypt(handle) → sees 50,000               ← SELECTIVE
  Competitor calls decrypt(handle) → ACCESS DENIED             ← BLOCKED
```

The compliance rules still execute (inside the TEE), but the data they operate on is encrypted. The regulator can audit via selective disclosure. The market sees nothing.

**Key insight:** ERC-3643's identity verification becomes much more powerful when combined with Nox. Instead of publishing "Alice is an accredited investor" for the world to see, the TEE can verify Alice's identity claim confidentially and enforce compliance rules — without leaking her identity or status on-chain.

---

## ERC-4626: The Vault Standard

### What It Is

ERC-4626 is the **Tokenized Vault Standard** — a standardized interface for yield-bearing vaults. If you've used Yearn, Aave, or any DeFi protocol where you deposit tokens and receive "share tokens" representing your position, that's ERC-4626.

### How It Works

```
You deposit 1,000 USDC into a vault
  │
  ├── Vault gives you 950 vault shares (share price: ~$1.05)
  │
  ├── The vault invests your USDC in strategies
  │   └── Lending, liquidity provision, arbitrage, etc.
  │
  ├── Over time, each share becomes worth more
  │   └── Your 950 shares are now worth $1,100
  │
  └── You redeem: burn 950 shares → get 1,100 USDC back
```

The standard interface:

```solidity
// Deposit: give tokens, get shares
function deposit(uint256 assets, address receiver) → uint256 shares

// Withdraw: burn shares, get tokens back
function withdraw(uint256 assets, address receiver, address owner) → uint256 shares

// How much is one share worth?
function convertToAssets(uint256 shares) → uint256 assets

// Total value locked in the vault
function totalAssets() → uint256
```

### The Problem: Strategy Leakage

An ERC-4626 vault on-chain today reveals:

```
Anyone can see:
  ✓ Total assets: $47M USDC locked
  ✓ Share price: $1.0523 (reveals yield performance)
  ✓ Alice deposited 500,000 USDC (whale spotted!)
  ✓ 3 addresses hold 80% of the vault (concentration risk visible)
  ✓ Bob just withdrew $2M (is something wrong?)
```

For a DeFi capital allocator, this is a disaster:
- Competitors see your TVL and copy your strategy
- Deposit/withdrawal patterns reveal conviction changes
- Whale tracking bots front-run large redemptions

### What Nox Changes

A **Confidential Vault** (ERC-4626 + Nox):

```
Today (ERC-4626):
  totalAssets(): 47,000,000 USDC                    ← PUBLIC
  deposit(500000, alice): 475,000 shares             ← PUBLIC
  share price: $1.0523                               ← PUBLIC

With Nox (Confidential Vault):
  totalAssets(): handle 0xDEF... (encrypted)          ← PRIVATE
  deposit(encHandle, proof): encrypted shares         ← PRIVATE
  share price: computable inside TEE only             ← PRIVATE

  Fund manager decrypts → sees $47M                   ← AUTHORIZED
  Auditor decrypts → sees $47M (selective disclosure) ← AUTHORIZED
  Competitor reads blockchain → sees opaque handles   ← BLOCKED
```

**The composability advantage:** Because ERC-4626 is a standard interface, a confidential vault built with Nox can still plug into DeFi aggregators and routing protocols. The interface is the same — the state is encrypted.

---

## ERC-7540: The Async Vault for Real-World Assets

### What It Is

ERC-7540 is an **extension of ERC-4626** designed for assets that can't be redeemed instantly — think private credit, real estate, or any illiquid asset. It adds an **asynchronous request/claim flow** on top of the standard vault interface.

### Why ERC-4626 Isn't Enough for RWA

In traditional DeFi (Aave, Yearn), you deposit and withdraw instantly. The underlying assets are liquid tokens on a DEX.

But real-world assets don't work that way:

| DeFi Vault (ERC-4626) | RWA Vault (ERC-7540) |
|---|---|
| Deposit USDC → get shares instantly | Request deposit → wait for fund manager approval → get shares |
| Withdraw → get USDC instantly | Request redemption → wait for liquidity / lock-up period → claim USDC |
| Shares always redeemable | Redemptions may be queued or gated |
| NAV updates every block | NAV updates weekly/monthly (off-chain valuation) |

### How ERC-7540 Works

```
Step 1: Request
  Alice calls requestRedeem(100 shares)
  └── Her request is queued. No immediate action.

Step 2: Processing (off-chain)
  Fund manager reviews redemption requests
  └── Sells underlying assets if needed
  └── Marks Alice's request as "fulfilled"

Step 3: Claim
  Alice calls claimRedeem()
  └── Gets her USDC back

Timeline: days to weeks, not seconds
```

The interface adds:

```solidity
// Request a deposit (async — doesn't execute immediately)
function requestDeposit(uint256 assets, address controller, address owner)

// Request a redemption (async — queued for processing)
function requestRedeem(uint256 shares, address controller, address owner)

// Check if a request is ready to claim
function pendingDepositRequest(address controller) → uint256
function pendingRedeemRequest(address controller) → uint256

// Claim when ready
function deposit(uint256 assets, address receiver) → uint256 shares  // claim deposit
function redeem(uint256 shares, address receiver, address owner) → uint256 assets  // claim redeem
```

### The Problem: Amplified Transparency Risk

ERC-7540's async nature makes the privacy problem **worse** than ERC-4626:

```
Anyone can see:
  ✓ Alice requested redemption of 100 shares 3 days ago (panic signal?)
  ✓ There are $5M in pending redemptions (liquidity crunch coming?)
  ✓ The fund manager hasn't fulfilled requests in 2 weeks (red flag?)
  ✓ Bob just deposited $2M (he knows something?)
  ✓ Redemption queue depth: 47 requests totaling $12M
```

In traditional finance, this information would be **strictly confidential** between the fund and its investors. On-chain, it's on a billboard.

For private credit especially, this is devastating:
- Pending redemptions signal distress to the market
- Deposit timing reveals investor conviction
- Queue depth exposes the fund's liquidity position

### What Nox Changes

A **Confidential Async Vault** (ERC-7540 + Nox):

```
Today (ERC-7540):
  requestRedeem(100 shares, alice)                   ← PUBLIC
  pendingRedeemRequest(alice): 100 shares            ← PUBLIC
  Total pending redemptions: $12M                    ← PUBLIC

With Nox (Confidential Async Vault):
  requestRedeem(encHandle, proof, alice)             ← PRIVATE (amount hidden)
  pendingRedeemRequest(alice): handle 0xFFF...       ← PRIVATE
  Total pending: handle 0x123... (encrypted)         ← PRIVATE

  Alice decrypts her pending request → 100 shares    ← OWNER ONLY
  Fund manager decrypts total pending → $12M         ← AUTHORIZED
  Market participant → sees opaque handles            ← BLOCKED
```

**Why this is the best fit for Nox:** ERC-7540 is already async by design — there's a delay between request and fulfillment. Nox's TEE computation model also has a brief async step (the off-chain compute pipeline). These two async patterns align naturally, making integration smoother than forcing synchronous privacy onto a synchronous vault.

---

## How They Fit Together

These three standards aren't competitors — they're **layers** that combine:

```
┌─────────────────────────────────────────────────┐
│              Application Layer                   │
│                                                  │
│  Private Credit Fund    Real Estate Token        │
│  RWA Marketplace        Tokenized Bond           │
├─────────────────────────────────────────────────┤
│              Vault Layer                         │
│                                                  │
│  ERC-4626 (sync vault)   ERC-7540 (async vault) │
│  deposit / withdraw      request / claim         │
├─────────────────────────────────────────────────┤
│              Compliance Layer                    │
│                                                  │
│  ERC-3643 (identity + transfer rules)            │
│  KYC, investor limits, jurisdiction checks       │
├─────────────────────────────────────────────────┤
│              Token Layer                         │
│                                                  │
│  ERC-20 (public)    or    ERC-7984 (confidential)│
├─────────────────────────────────────────────────┤
│              Confidentiality Layer               │
│                                                  │
│  Nox Protocol                                    │
│  Encrypted state, handles, TEE compute, ACL      │
└─────────────────────────────────────────────────┘
```

A concrete example: **Confidential Private Credit Fund**

```
1. Compliance: ERC-3643 ensures only accredited investors can participate
   └── Identity verification runs inside TEE (private KYC)

2. Vault: ERC-7540 manages the async deposit/redemption lifecycle
   └── Amounts and queue depth are encrypted handles

3. Token: ERC-7984 confidential shares represent investor positions
   └── Balances hidden, transfers private

4. Disclosure: Fund manager grants auditor viewer access via ACL
   └── Auditor decrypts total AUM, investor list, pending redemptions
   └── Market sees nothing
```

---

## The Competitive Landscape

| Feature | ERC-3643 alone | ERC-4626/7540 alone | + Nox |
|---|---|---|---|
| Compliance rules | On-chain, public | N/A | On-chain, **enforced in TEE** (private) |
| Investor balances | Public | Public | **Encrypted** (handles) |
| Transfer amounts | Public | Public | **Encrypted** |
| Vault TVL | N/A | Public | **Encrypted** (auditors can decrypt) |
| Pending redemptions | N/A | Public | **Encrypted** |
| Identity claims | Public (on-chain registry) | N/A | **Verified in TEE** (not exposed) |
| Regulatory audit | Trivial (everything public) | Trivial | **Selective disclosure** (ACL) |

The key trade-off: without Nox, compliance is easy because everything is public — but adoption is blocked because institutions won't expose their data. With Nox, compliance requires selective disclosure — but adoption becomes possible because data is private by default.

---

## Key Takeaways

1. **ERC-3643** handles compliance (KYC, transfer rules) but publishes identity claims and positions on-chain. Nox can keep the compliance while hiding the data.

2. **ERC-4626** standardizes vaults but exposes TVL, deposit/withdrawal amounts, and share prices. A confidential vault wraps the same interface with encrypted state.

3. **ERC-7540** extends vaults for illiquid/async assets (private credit, real estate) but makes the problem worse — pending redemptions and queue depth become public signals. Nox's async model is a natural fit.

4. **These standards stack.** A real-world product might use ERC-3643 for compliance + ERC-7540 for async vaults + ERC-7984 for confidential tokens — all powered by Nox.

5. **The unlock for institutional adoption:** Institutions don't need less compliance — they need **private compliance**. Selective disclosure via Nox's ACL is the bridge between "everything public" and "audit on demand."

---

*Back to the [index](./README.md) to review all topics.*
