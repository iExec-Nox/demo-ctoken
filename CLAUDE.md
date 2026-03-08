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
- **State:** React Context (FaucetModalProvider, WrapModalProvider, TransferModalProvider, SelectiveDisclosureModalProvider, ThemeProvider)
- **Nox SDK:** Import SDK functions for `encrypt`, `decrypt`, `wrap`, `confidentialTransfer`, `shareView`
- **Chain:** Arbitrum Sepolia (chainId: 421614)
- **Prices:** CoinGecko API via Next.js API route (`app/api/prices/route.ts`, revalidate 60s)

---

## Project Structure

```
/app
  /(landing)          # Landing page + Terms (Header + Footer layout)
  /(app)              # Dashboard, Explorer (Topbar + DashboardHeader layout)
  /api/prices         # CoinGecko proxy
/components
  /layout             # Topbar, Header, Footer, DashboardHeader, MobileMenu
  /landing            # HeroSection, FeatureCard, FeaturesSection
  /dashboard          # DashboardContent, Assets, ActionCenter, TokenRow
  /modals             # Faucet, Wrap, Transfer, SelectiveDisclosure (Provider + Modal)
  /shared             # Reusable: Logo, CodeSection, InfoCard, ErrorMessage, TxStatus...
  /explorer           # ExplorerContent, ActivityTable
  /ui                 # shadcn primitives (do not modify directly)
  providers.tsx       # Provider nesting hierarchy
/hooks                # Transaction hooks, balance hooks, UI hooks
/lib                  # contracts, tokens, wagmi, gas, format, utils, ABIs
/docs/decisions       # ADR-0001 to ADR-0012
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
- Action Center: Wrap, Unwrap, Transfer, Selective Disclosure buttons — disabled when no balance
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
- Code section visible when Dev Mode is on (global toggle, not per-modal)
- Cancel button

**SDK wiring:** Done for RLC/cRLC. Hooks: `useWrap`, `useUnwrap` in `/hooks`. See `nox-contracts.md` for detailed flows.

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
- Code section visible when Dev Mode is on (global toggle)
- "Confidential Transfer Complete" status + Arbiscan link
- Network Fee: dynamic via `useEstimatedFee` hook (see ADR-0010)

**SDK wiring:** Done for cRLC. Hook: `useConfidentialTransfer` in `/hooks`.

---

### 6. Selective Disclosure / ACL (modal) — DONE

**Priority:** Must Have — **Status: Implemented (see ADR-0009)**

- Modal via `SelectiveDisclosureModalProvider` + `SelectiveDisclosureModal`
- Add viewer address (validated with `isAddress()` from viem)
- On confirm: reads balance handle via `confidentialBalanceOf`, then calls `addViewer(handle, viewerAddress)` on NoxCompute contract
- Progress tracker: Read Handle → Granting Access → Confirmed
- Code section visible when Dev Mode is on
- Use case framing: compliance, audits, enterprise adoption

**SDK wiring:** Done. Hook: `useAddViewer` in `/hooks`. Note: `addViewer` is per-handle (not per-token) — must be re-called after each tx that changes the balance handle.

**Not yet implemented:** List of current viewers, revoke functionality.

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

**Modales existantes :** FaucetModal, WrapModal, TransferModal, SelectiveDisclosureModal

**Hiérarchie des providers** dans `providers.tsx` :
```
ThemeProvider → WagmiProvider → QueryClientProvider → TooltipProvider → FaucetModalProvider → WrapModalProvider → TransferModalProvider → SelectiveDisclosureModalProvider → {children}
```

### Dev Mode (ADR-0011)

- **Enabled by default** — premier visiteur voit immédiatement les sections code (différenciateur clé)
- **Toggle global** dans `DashboardHeader` et mobile menu — pas de toggle dans les modales individuelles
- Hook : `useDevMode()` (persisté en localStorage, retourne `true` si absent)
- **Section code** en bas des modales : composant `<CodeSection>` (shared) — titre "Function called" + bouton copier + `<pre>` Solidity
- Conditionnel : `{devMode && ( ... )}`

### Shared Components (extracted from modals)

Les patterns visuels dupliqués ont été extraits dans `components/shared/` :
- **`<CodeSection>`** — Section dev mode avec titre + copier + `<pre>` Solidity
- **`<InfoCard>`** — Card "How it works" avec icône info
- **`<ErrorMessage>`** — Affichage erreur + bouton retry
- **`<TxSuccessStatus>`** — Badge succès + lien Arbiscan

### Progress Tracker

Composant non-extrait (inline dans chaque modale) mais suit le même pattern :
- 3-4 étapes selon l'opération (Approve → Action → Confirmed)
- Icônes Material : `check_circle` (done), `sync` (en cours), `verified` (confirmed)
- Barres de progression colorées entre les étapes

### Token Config — Source unique de vérité

`lib/tokens.ts` est la seule source pour tous les tokens :
- **`tokens`** — Tous les tokens (ETH natif + ERC-20)
- **`erc20Tokens`** — Tokens avec adresse (filtre `isNative`)
- **`wrappableTokens`** — ERC-20 avec `wrappable: true`
- **`confidentialTokens`** — Dérivé automatiquement : préfixe `c` + `confidentialAddress`

**Pour ajouter un nouveau cToken :** ajouter `wrappable: true` et `confidentialAddress: "0x..."` au token de base. Pas de double source de vérité.

### Contract Addresses — Source unique (`lib/contracts.ts`)

```ts
export const NOX_COMPUTE_ADDRESS = "0x5633472D35E18464CA24Ab974954fB3b1B122eA6";
export const ZERO_ADDRESS = "0x" + "0".repeat(40);
export const ZERO_HANDLE = "0x" + "0".repeat(64);
```

Les adresses des tokens (RLC, cRLC) sont dans `lib/tokens.ts` (via `address` et `confidentialAddress`).
Les ABIs sont dans `lib/confidential-token-abi.ts` et `lib/nox-compute-abi.ts`.

### Transaction Hook Pattern

Tous les hooks de transaction suivent le même contrat :

```ts
type Step = "idle" | "step1" | "step2" | ... | "confirmed" | "error";

interface UseXxxResult {
  step: Step;
  error: string | null;
  txHash?: `0x${string}`;
  action: (...args) => Promise<void>;
  reset: () => void;
}
```

Hooks existants : `useWrap`, `useUnwrap`, `useConfidentialTransfer`, `useAddViewer`.
Erreurs formatées via `formatTransactionError()` dans `lib/utils.ts`.

### Gas & Fee Estimation

- **`lib/gas.ts`** — `estimateGasOverrides(publicClient)` : fetche les fees EIP-1559 avec buffer 20%
- **`useEstimatedFee(gasLimit)`** — Hook retournant le fee dynamique (gasPrice × gasLimit), auto-refresh avec chaque bloc
- Gas limits par opération : Wrap ~150k, Unwrap ~300k, Transfer ~200k

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
| Wrap / Unwrap            | Must Have           | Done (UI + SDK wired)     |
| Transfer                 | Must Have           | Done (UI + SDK wired)     |
| Selective Disclosure/ACL | Must Have           | Done (UI + SDK wired)     |
| Activity Explorer        | Must Have           | Done (UI, subgraph TBD)   |
| Developer Mode           | Must Have           | Done (global, default on) |
| Arbiscan Links           | Must Have           | Done                      |
| Light/Dark Theme         | Done                | Done                      |
| Terms of Use             | Must Have           | Done                      |
| Dynamic Network Fees     | Must Have           | Done (ADR-0010)           |
| Responsive mode          | Must Have           | TODO                      |
| Settings page            | Must Have for EthCC | TODO                      |
| Viewer list + revoke     | Nice to Have        | TODO                      |

---

## Web3 Best Practices

- **Address validation:** Toujours utiliser `isAddress()` de viem — jamais de regex custom
- **Transaction receipts:** Toujours `waitForTransactionReceipt({ hash })` après `writeContractAsync` avant de passer à l'étape suivante
- **Event decoding:** Utiliser `decodeEventLog()` de viem avec l'ABI — jamais de scan heuristique des logs bruts
- **Approve exact:** Montant exact uniquement (pas d'infinite approval) — choix de sécurité du protocole Nox
- **Custom RPC:** Configurer `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC` pour éviter le rate-limiting du RPC public (surtout sur Vercel)
- **Gas overrides:** Utiliser `estimateGasOverrides()` de `lib/gas.ts` — MetaMask sous-estime le gas sur Arbitrum
- **Cooldowns inter-étapes:** 2-3s de délai entre les tx séquentielles (approve → wrap, unwrap → finalize) car NoxCompute (TEE) a un délai de traitement
- **HandleClient client-side only:** `@iexec-nox/handle` utilise Web Crypto API — jamais d'import côté serveur (SSR)
- **Handles are ephemeral:** Le handle de balance change après chaque tx — toujours re-lire `confidentialBalanceOf` après une opération

---

## Notes for Claude Code

- Project is scaffolded with Next.js 16 + wagmi + Reown AppKit + Tailwind v4 + shadcn/ui
- Real balances are fetched via wagmi hooks (ETH native, USDC, RLC on Arbitrum Sepolia)
- Confidential balances are handles (bytes32) read via `confidentialBalanceOf`, decrypted on user click via `useDecryptBalance`
- Prices fetched via CoinGecko API route (`app/api/prices/route.ts`)
- SDK wiring is done for RLC/cRLC — smart contract interactions are in dedicated hooks (`/hooks/use-wrap.ts`, `use-unwrap.ts`, `use-confidential-transfer.ts`, `use-add-viewer.ts`)
- ABIs are in `lib/confidential-token-abi.ts` and `lib/nox-compute-abi.ts`
- **Next priorities:** Responsive mode, Settings page, Viewer list + revoke, on-chain subgraph for Activity Explorer
- EthCC is a hard deadline — ensure Settings (theme toggle) and all Must Have features are complete before that date
- Design system is documented in `components/CLAUDE.md` — always use semantic tokens, never hardcode colors
- USDC/cUSDC addresses not yet deployed — only RLC/cRLC are available on testnet
