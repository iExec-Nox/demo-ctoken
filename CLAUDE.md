# CLAUDE.md – Nox Confidential Token Demo

Always present a plan before implementing. Never jump into code changes without first outlining the approach and getting user approval.

## Project Overview

Build a web3 frontend demo showcasing the **Nox confidential computing protocol** on Arbitrum Sepolia testnet. Users can mint, transfer, and audit private tokens (cTokens) using a polished, developer-friendly UI. The app must match the onboarding quality of Zama and Inco while differentiating through ACL management and embedded developer tooling.

**Tech Target:** Arbitrum Sepolia testnet  
**Token Standard:** ERC-7984 (confidential tokens)  
**Benchmark apps:** [Zama Portfolio](https://portfolio.zama.org/), Inco Comfy, Railgun Token Shielder

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Styling:** Tailwind CSS v4 + shadcn/ui (New York style)
- **Web3:** wagmi v2 + viem + Reown AppKit (wallet connection — see ADR-0001)
- **State:** React Context (FaucetModalProvider, WrapModalProvider, TransferModalProvider, ThemeProvider)
- **Nox SDK:** Import SDK functions for `encrypt`, `decrypt`, `wrap`, `confidentialTransfer`, `shareView`
- **Chain:** Arbitrum Sepolia (chainId: 421614)
- **Prices:** CoinGecko API via Next.js API route (`app/api/prices/route.ts`, revalidate 60s)

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

### 1. Landing / Connect Wallet (`/`) — DONE

**Priority:** Must Have — **Status: Implemented**

- Tagline: _"Manage your confidential assets privately"_
- Reown AppKit modal supporting MetaMask, Rabby, Coinbase Wallet, WalletConnect
- Network defaults to Arbitrum Sepolia
- CTA button: "Try It Now" opens wallet modal, "Talk to us" external link
- After connection → redirect to `/dashboard`

**Route group:** `app/(landing)/` with dedicated layout (Header + Footer, no Topbar)

---

### 2. Faucet (modal, no dedicated page) — DONE

**Priority:** Must Have — **Status: Implemented (see ADR-0003)**

- **Architecture:** Global modal via `FaucetModalProvider` (React Context) + shadcn Dialog — no `/faucet` route
- 3 token cards (ETH, RLC, USDC) with "Mint" buttons linking to external faucets
- Entry points: EmptyPortfolio CTA, Topbar "Get Test Tokens", Dashboard nav menu "Faucet"
- Modal tokens: `--modal-bg`, `--modal-border` in globals.css

> Note: future iteration may add an on-chain faucet contract with tx status tracking

---

### 3. Dashboard (`/dashboard`) — DONE

**Priority:** Must Have — **Status: Implemented**

- Portfolio header with total value (USD) via CoinGecko prices
- Public assets section (ETH, USDC, RLC) with real balances via wagmi
- Confidential assets section (cUSDC placeholder — empty state)
- Action Center: Wrap, Unwrap, Transfer (wired), Selective Disclosure (TODO) buttons — disabled when no balance
- Privacy Status card
- Empty portfolio state with faucet CTA
- Skeleton loader (`loading.tsx`)

**Route group:** `app/(app)/` with Topbar + DashboardHeader layout

---

### 4. Wrap / Unwrap (modal) — DONE

**Priority:** Must Have — **Status: Implemented (UI — see ADR-0005)**

**Conceptual model:** L'utilisateur envoie des tokens publics (ex: USDC) vers un smart contract qui les **bloque**. En retour, il reçoit des tokens confidentiels (cUSDC) au ratio 1:1. Unwrap = l'inverse (brûler les cTokens pour récupérer les tokens publics).

- Modal via `WrapModalProvider` + `WrapModal` (pattern Provider + Modal)
- Two tabs: **Wrap** (public → cToken) and **Unwrap** (cToken → public)
- Token selector dropdown (ERC-20 tokens with `wrappable: true`)
- Amount input with balance validation + MAX button
- Transaction details (1:1 ratio, estimated gas)
- Progress tracker: Approve → Wrap/Unwrap → Confirmed
- Dev Mode toggle (top-left) + code section (Solidity function)
- Cancel button

**SDK call (TODO — wire when contracts deployed):**

```ts
await noxSDK.wrap({ token: "USDC", amount, userAddress });
await noxSDK.unwrap({ cToken: "cUSDC", amount, userAddress });
```

---

### 5. Transfer Confidential Token (modal) — DONE

**Priority:** Must Have — **Status: Implemented (UI — see ADR-0006)**

- Modal via `TransferModalProvider` + `TransferModal` (pattern Provider + Modal)
- Token selector dropdown (`confidentialTokens`: cUSDC, cRLC)
- Amount input with balance validation
- Recipient address field with format validation (`0x` + 40 hex chars) + visual feedback (green check / red X)
- Transaction info summary (Recipient → Encrypted Hash, Token, Network Fee)
- "How it works" info card
- Progress tracker: Approve → Transfer → Confirmed
- Dev Mode toggle + code section (`confidentialTransfer` Solidity function)
- "Confidential Transfer Complete" status + Arbiscan link
- Network Fee: static ~0.0004 ETH for now (TODO: dynamic via `useGasPrice()` when SDK/ABI available)

**SDK call (TODO — wire when contracts deployed):**

```ts
await noxSDK.confidentialTransfer({ cToken, amount, recipient });
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

## Components

Component conventions, design system, inventory and shared component specs are in [`components/CLAUDE.md`](./components/CLAUDE.md).

---

## Architecture Patterns

### Modal Pattern (Provider + Modal + Hook)

Toutes les modales du projet suivent le même pattern. Pour créer une nouvelle modale :

1. **Provider** (`components/xxx-modal-provider.tsx`) — Context React + state `open`/`setOpen` + convenience method (`openXxx()`) + monte `<XxxModal />` dans le JSX
2. **Modal** (`components/xxx-modal.tsx`) — Composant UI utilisant `Dialog`/`DialogContent` de shadcn
3. **Hook** (`useXxxModal()`) — Exposé par le provider pour déclencher l'ouverture depuis n'importe quel composant
4. **Câblage** — Ajouter `<XxxModalProvider>` dans `providers.tsx` (s'imbrique après le dernier modal provider)

**Modales existantes :** FaucetModal, WrapModal, TransferModal

**Hiérarchie des providers** dans `providers.tsx` :
```
ThemeProvider → WagmiProvider → QueryClientProvider → FaucetModalProvider → WrapModalProvider → TransferModalProvider → {children}
```

### Dev Mode dans les modales

Pattern standard pour toutes les modales d'action :
- **Toggle** `<DevModeToggle label="Dev Mode" />` en haut à gauche de la modale
- **Section code** en bas : icône "code" + titre "Function called" + bouton copier + `<pre>` avec le code Solidity du smart contract
- Conditionnel : `{devMode && ( ... )}`
- Hook : `useDevMode()` (persisté en localStorage)

### Progress Tracker (3 étapes)

Pattern visuel réutilisé dans Wrap et Transfer :
- **Étape 1** : Approve (vert, check_circle)
- **Étape 2** : Action spécifique — Wrap/Unwrap/Transfer (bleu primary, sync)
- **Étape 3** : Confirmed (gris muted, verified)
- Barres de progression colorées entre les étapes

### Token Config — Source unique de vérité

`lib/tokens.ts` est la seule source pour tous les tokens :
- **`tokens`** — Tous les tokens (ETH natif + ERC-20)
- **`erc20Tokens`** — Tokens avec adresse (filtre `isNative`)
- **`wrappableTokens`** — ERC-20 avec `wrappable: true`
- **`confidentialTokens`** — Dérivé automatiquement : préfixe `c` + `confidentialAddress`

**Pour ajouter un nouveau cToken :** ajouter `wrappable: true` et `confidentialAddress: "0x..."` au token de base. Pas de double source de vérité.

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
| First Connection | Landing → Connect Wallet (Reown AppKit) → Dashboard                                      |
| Faucet           | Dashboard → Faucet modal → Click external faucet link → Balance updates on return         |
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
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<reown_project_id>
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

> Contract-related env vars (`FAUCET_ADDRESS`, `WRAPPER_ADDRESS`, etc.) will be added when smart contracts are deployed.

---

## Development Commands

```bash
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

---

## Git Workflow

**Always use the `/commit` skill** for all commits. Never commit manually without it.

This skill enforces:
- **Atomic commits** — one commit per logical change, staged selectively by file
- **Conventional Commits** — `<type>(<scope>): <description>` format
- **Auto push + PR** when on a feature branch

See [`/.claude/skills/commit/SKILL.md`](./.claude/skills/commit/SKILL.md) for full details.

---

## Priority Matrix (Must Have vs Nice to Have)

| Feature                  | Priority            | Status                    |
| ------------------------ | ------------------- | ------------------------- |
| Landing / Connect Wallet | Must Have           | Done                      |
| Faucet                   | Must Have           | Done                      |
| Dashboard                | Must Have           | Done                      |
| Wrap / Unwrap            | Must Have           | Done (UI, SDK TODO)       |
| Transfer                 | Must Have           | Done (UI, SDK TODO)       |
| Delegate View / ACL      | Must Have           | TODO — next priority      |
| Activity Explorer        | Must Have           | TODO                      |
| Developer Mode           | Must Have           | TODO                      |
| Arbiscan Links           | Must Have           | Done (component ready)    |
| Light/Dark Theme         | Done                | Done                      |
| Responsive mode          | Must Have           | TODO                      |
| Settings page            | Must Have for EthCC | TODO                      |

---

## Notes for Claude Code

- Project is scaffolded with Next.js 16 + wagmi + Reown AppKit + Tailwind v4 + shadcn/ui
- Real balances are fetched via wagmi hooks (ETH native, USDC, RLC on Arbitrum Sepolia)
- Prices fetched via CoinGecko API route (`app/api/prices/route.ts`)
- The Nox SDK is not yet available — create `lib/nox-sdk.ts` abstraction when contract addresses/ABIs are provided
- Keep all smart contract interactions behind the `lib/nox-sdk.ts` abstraction layer for easy swap-out
- **Next priorities:** Delegate View modal (Selective Disclosure button), then Activity Explorer, then Developer Mode page, then Settings
- **Network Fee:** statique (~0.0004 ETH) dans les modales — TODO rendre dynamique via `useGasPrice()` de wagmi quand le SDK/ABI sera disponible
- **SDK wiring:** Toutes les modales (Wrap, Transfer) ont l'UI prête mais les appels SDK sont en attente du déploiement des smart contracts
- EthCC is a hard deadline — ensure Settings (theme toggle) and all Must Have features are complete before that date
- Design system is documented in `components/CLAUDE.md` — always use semantic tokens, never hardcode colors
