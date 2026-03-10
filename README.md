# Nox Confidential Token Demo

A web3 frontend demo showcasing the **Nox confidential computing protocol** on Arbitrum Sepolia. Users can wrap, transfer, and audit private tokens (cTokens) using the ERC-7984 standard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 + shadcn/ui (New York) |
| Web3 | wagmi v2 + viem + Reown AppKit |
| Confidential | Nox SDK (`@iexec-nox/handle`) |
| Chain | Arbitrum Sepolia (421614) |
| Prices | CoinGecko API (via Next.js API route) |

---

## Features

- **Wallet connection** — MetaMask, Rabby, Coinbase Wallet, WalletConnect
- **Dashboard** — Portfolio overview with public & confidential balances
- **Faucet** — Quick access to testnet token faucets
- **Wrap / Unwrap** — Convert public tokens (USDC, RLC) into confidential tokens (cUSDC, cRLC) at 1:1 ratio
- **Confidential Transfer** — Send cTokens with encrypted amounts
- **Selective Disclosure** — Grant auditors read access to your confidential balance
- **Activity Explorer** — Transaction history with filtering
- **Developer Mode** — Inspect smart contract calls and Nox SDK methods
- **Light / Dark theme** — Full theme support

---

## Deployed Contracts (Arbitrum Sepolia)

| Contract | Address |
|----------|---------|
| USDC (ERC-20) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| cUSDC (ERC-7984) | `0x305df62f6903fad716cc45abcc0e5c180979c169` |
| RLC (ERC-20) | `0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963` |
| cRLC (ERC-7984) | `0x271f46e78f2fe59817854dabde47729ac4935765` |
| NoxCompute | `0x5633472D35E18464CA24Ab974954fB3b1B122eA6` |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A WalletConnect project ID ([cloud.reown.com](https://cloud.reown.com))

### Setup

```bash
git clone https://github.com/iExec-Nox/demo-ctoken.git
cd demo-ctoken
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_project_id>
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://arbitrum-sepolia.gateway.tenderly.co
```

### Run

```bash
npm run dev       # http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

---

## Project Structure

```
app/
  (landing)/            # Landing page + Terms (Header + Footer layout)
  (app)/                # Dashboard, Explorer (Topbar + DashboardHeader layout)
  api/prices/           # CoinGecko proxy
components/
  layout/               # Topbar, Header, Footer, DashboardHeader, MobileMenu
  landing/              # HeroSection, FeatureCard, FeaturesSection
  dashboard/            # DashboardContent, Assets, ActionCenter, TokenRow
  modals/               # Faucet, Wrap, Transfer, SelectiveDisclosure
  shared/               # Logo, CodeSection, InfoCard, ErrorMessage, TxStatus…
  explorer/             # ExplorerContent, ActivityTable
  ui/                   # shadcn primitives
hooks/                  # Transaction hooks, balance hooks, UI hooks
lib/                    # Contracts, tokens, wagmi config, gas, ABIs
```

---

## Operations

### Wrap / Unwrap

Convert public tokens (USDC, RLC) into confidential tokens (cUSDC, cRLC) at 1:1 ratio. Unwrap burns cTokens to recover the underlying ERC-20.

### Confidential Transfer

Transfer cTokens to another address. The amount is encrypted — no on-chain observer can determine it.

### Selective Disclosure

Grant a viewer (auditor, regulator) read access to your confidential balance. Access is per-handle and must be re-granted after each transaction.

---

## License

MIT
