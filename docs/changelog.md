# Changelog du projet

Historique chronologique des décisions et implémentations du projet Nox Confidential Token Demo.

---

### 2026-03-01 — Modale Selective Disclosure

Implémentation de la modale Selective Disclosure (délégation de vue ACL) avec formulaire d'ajout de viewer (adresse, scope Full Portfolio/Specific Token, sélection de tokens), code viewer dev mode, sections Current/Past Viewers statiques, et security note. Pattern Provider/Hook cohérent avec les modales existantes.

→ ADR : [ADR-0006](./decisions/0006-selective-disclosure-modal.md)

### 2026-02-27 — Forcer le réseau Arbitrum Sepolia

Restriction de la config AppKit à Arbitrum Sepolia uniquement (`allowUnsupportedChain: false`, retrait d'`arbitrum` mainnet). Le mécanisme per-dApp natif de MetaMask et AppKit `defaultNetwork` assurent la connexion sur le bon réseau sans code custom.

→ ADR : [ADR-0004](./decisions/0004-enforce-arbitrum-sepolia-network.md)

### 2026-02-26 — Connexion wallet via RainbowKit

Implémentation de la connexion wallet avec modale custom fidèle au design Figma, support Arbitrum + Arbitrum Sepolia, blur backdrop, et redirection post-connexion vers le dashboard.

→ ADR : [ADR-0001](./decisions/0001-wallet-connect-rainbowkit.md)

### 2026-02-27 — Modale Faucet

Ajout d'une modale Faucet (shadcn Dialog) avec 3 cartes token (ETH, RLC, USDC), accessible depuis le nav menu, l'empty portfolio et la topbar via un Context React.

→ ADR : [ADR-0003](./decisions/0003-faucet-modal.md)
