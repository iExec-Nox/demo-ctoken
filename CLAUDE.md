# CLAUDE.md – Nox Confidential Token Demo

## Project Overview

Build a web3 frontend demo showcasing the **Nox confidential computing protocol** on Arbitrum Sepolia testnet. Users can mint, transfer, and audit private tokens (cTokens) using a polished, developer-friendly UI. The app must match the onboarding quality of Zama and Inco while differentiating through ACL management and embedded developer tooling.

**Tech Target:** Arbitrum Sepolia testnet  
**Token Standard:** ERC-7984 (confidential tokens)  
**Benchmark apps:** [Zama Portfolio](https://portfolio.zama.org/), Inco Comfy, Railgun Token Shielder

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Web3:** wagmi v2 + viem + RainbowKit (wallet connection)
- **State:** Zustand or React Context
- **Nox SDK:** Import SDK functions for `encrypt`, `decrypt`, `wrap`, `confidentialTransfer`, `shareView`
- **Chain:** Arbitrum Sepolia (chainId: 421614)

---

## Project Structure

```
/app
/components
/lib
/hooks

```

---

## Pages & Features

### 1. Landing / Connect Wallet (`/`)

**Priority:** Must Have

- Tagline: _"Manage your confidential assets privately"_
- `ConnectWallet` button supporting MetaMask, Rabby, Coinbase Wallet, WalletConnect
- Network selector defaulting to Arbitrum Sepolia
- CTA button: "Get Testnet Tokens" → navigates to `/faucet`
- After connection → redirect to `/dashboard`

**Component hints:**

```tsx
<HeroSection tagline="Manage your confidential assets privately" />
<ConnectWalletButton />
<NetworkSelector defaultChain="arbitrum-sepolia" />
```

---

### 2. Faucet (`/faucet`)

**Priority:** Must Have (core differentiator vs competitors using external faucets)

- Request testnet USDC and/or ETH from a built-in faucet
- Show claim limits (e.g., max 100 USDC per address per day)
- Show transaction status (pending → success/failure)
- Update balances after claim
- Display Arbiscan link for faucet tx

**State flow:** `idle → requesting → pending → success | error`

---

### 3. Dashboard (`/dashboard`)

**Priority:** Must Have

- Display portfolio: confidential tokens (cUSDC, cETH) + public tokens (USDC)
- Show balances in token units + approximate USD value
- Quick action buttons: **Wrap**, **Unwrap**, **Transfer**, **Delegate View**
- Recent activity summary (last 5 transactions)
- Each token card links to wrap/transfer actions

---

### 4. Wrap / Unwrap (`/wrap`)

**Priority:** Must Have

Two tabs: **Wrap** (public → cToken) and **Unwrap** (cToken → public).

**Wrap flow:**

1. Select source token (default: USDC on Arbitrum Sepolia)
2. Input amount → display expected cToken output (1:1 ratio) + fees
3. Confirm → sign → send tx to wrapper contract
4. Show progress indicator
5. On success: update balances, show Arbiscan link

**Unwrap flow:** Mirror of wrap, reversed direction.

**SDK call:**

```ts
await noxSDK.wrap({ token: "USDC", amount, userAddress });
await noxSDK.unwrap({ cToken: "cUSDC", amount, userAddress });
```

---

### 5. Transfer Confidential Token (`/transfer`)

**Priority:** Must Have

- Select cToken (cUSDC, cETH, etc.)
- Input amount
- Input recipient address (with ENS resolution if possible)
- Optional memo/note field
- Transaction preview: recipient, token, amount, estimated fees
- Confirm → sign → send
- Status display: pending / success / failure
- On success: tx hash + Arbiscan link

**SDK call:**

```ts
await noxSDK.confidentialTransfer({ cToken, amount, recipient, note });
```

---

### 6. Delegate View / Manage ACL (`/delegate`)

**Priority:** Must Have (major differentiator — competitors rarely expose ACL in UI)

- Add auditor/viewer address + select scope (specific token or full portfolio)
- List of current delegated viewers with revoke button
- On confirm: call `shareView()` on the cToken contract
- Show success confirmation and update the delegate list
- Use case framing: compliance, audits, enterprise adoption

**SDK call:**

```ts
await noxSDK.shareView({ scope: "cUSDC" | "all", auditorAddress });
await noxSDK.revokeView({ auditorAddress });
```

---

### 7. Activity Explorer (`/explorer`)

**Priority:** Must Have

- Transaction history table with columns: Date, Type, Token, Amount, Status, Handle(?), Arbiscan link
- Types: wrap, unwrap, transfer, view delegation
- Filter by operation type
- In Developer Mode: show detailed logs (pipeline events, error messages), filterable by type

---

### 8. Developer Mode / Tools (`/developer`)

**Priority:** Must Have (strong adoption lever — no competitor embeds dev tooling in UI)

- Toggle to enable/disable Developer Mode (persisted in localStorage)
- When enabled, show across all pages:
  - **Function Call Viewer:** display the smart contract function (e.g., `wrap()`, `confidentialTransfer()`) and Nox SDK method invoked for each user action
  - **Detailed log panel:** pipeline events, error messages, filterable by type
- Quick-access code snippets:
  - Calling `encrypt` / `decrypt` SDK functions
  - Deploying ERC-7984 contracts
  - Sample transactions
- Links to GitHub repo and documentation
- **Warning banner:** _"Developer mode exposes sensitive debugging information and is not intended for general users."_

---

### 9. Settings (`/settings`)

**Priority:** Must Have for EthCC; Up 2 Design otherwise

- Light / Dark theme toggle
- Wallet info display
- Network configuration

---

## Shared Components

### `<TxStatus />`

Displays transaction lifecycle: `idle | pending | success | error` with spinner and colored badges.

### `<ArbiscanLink />`

```tsx
<ArbiscanLink txHash={hash} />
// Renders: "View on Arbiscan ↗" opening in new tab
// Base URL: https://sepolia.arbiscan.io/tx/{hash}
```

Must be present on **every** transaction confirmation screen.

### `<DeveloperModeProvider />`

Wraps the app. When Developer Mode is active, injects a floating log panel and annotates SDK calls.

---

## Contract Addresses (Arbitrum Sepolia — TBD, placeholder)

```ts
// lib/contracts.ts
export const CONTRACTS = {
  WRAPPER: "0x...", // ERC-7984 wrapper contract
  USDC: "0x...", // Testnet USDC
  cUSDC: "0x...", // Confidential USDC
  FAUCET: "0x...", // Testnet faucet
};
```

> ⚠️ Replace with real deployed addresses before testing.

---

## Nox SDK Integration (`lib/nox-sdk.ts`)

Wrap all SDK calls in a single module for easy mocking and replacement:

```ts
import { NoxSDK } from "@iexec/nox-sdk" // adjust import path

export async function wrapToken(params: WrapParams) { ... }
export async function unwrapToken(params: UnwrapParams) { ... }
export async function confidentialTransfer(params: TransferParams) { ... }
export async function shareView(params: ShareViewParams) { ... }
export async function revokeView(params: RevokeViewParams) { ... }
export async function encryptValue(value: bigint, publicKey: string) { ... }
export async function decryptValue(handle: string, privateKey: string) { ... }
```

---

## User Flows Summary

| Flow             | Steps                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| First Connection | Landing → Connect Wallet → Network Selection → Dashboard                                  |
| Faucet           | Faucet page → Request tokens → Confirm → Balance updates                                  |
| Wrap             | Dashboard → Wrap → Select USDC → Input amount → Confirm → cUSDC balance updates           |
| Transfer         | Dashboard/Transfer tab → Select cToken + amount → Recipient address → Confirm → Tx status |
| Delegate View    | Delegate tab → Add auditor address + scope → Confirm → Record shown                       |

---

## UI/UX Requirements

- **Responsive:** Desktop-first, mobile-friendly
- **Theme:** Light and dark mode support
- **Arbiscan links:** Every transaction must include a direct link to `https://sepolia.arbiscan.io/tx/{hash}`, opening in a new tab
- **Wallet support:** MetaMask, Rabby, Coinbase Wallet, WalletConnect
- **Loading states:** Skeleton loaders for balance fetching, spinners for tx confirmation
- **Error handling:** User-friendly error messages for rejected transactions, network errors, insufficient balance

---

## Environment Variables

```env
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_FAUCET_ADDRESS=0x...
NEXT_PUBLIC_WRAPPER_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
```

---

## Development Commands

```bash
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

---

## Priority Matrix (Must Have vs Nice to Have)

| Feature                  | Priority            |
| ------------------------ | ------------------- |
| Landing / Connect Wallet | Must Have           |
| Faucet                   | Must Have           |
| Dashboard                | Must Have           |
| Wrap / Unwrap            | Must Have           |
| Transfer                 | Must Have           |
| Delegate View / ACL      | Must Have           |
| Activity Explorer        | Must Have           |
| Developer Mode           | Must Have           |
| Arbiscan Links           | Must Have           |
| Light/Dark Theme         | Up 2 Design         |
| Responsive mode          | Must Have           |
| Settings page            | Must Have for EthCC |

---

## Notes for Claude Code

- Start by scaffolding the Next.js project with wagmi + RainbowKit + Tailwind
- Use mock data initially for balances and tx history; replace with real contract calls once addresses are available
- The Nox SDK may not be published yet — create a `lib/nox-sdk-mock.ts` with typed stubs for all functions so the UI can be built and tested independently
- Keep all smart contract interactions behind the `lib/nox-sdk.ts` abstraction layer for easy swap-out
- Prioritize the Wrap and Transfer flows first, then Delegate View, then Developer Mode
- EthCC is a hard deadline — ensure Settings (theme toggle) and all Must Have features are complete before that date
