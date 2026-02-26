# ADR-0001 : Connexion wallet via RainbowKit avec modale custom

**Date :** 2026-02-26
**Statut :** Accepté

## Contexte

La page d'accueil possède un bouton "Connect Wallet" statique sans fonctionnalité. Il faut implémenter la connexion wallet pour permettre aux utilisateurs d'accéder au dashboard et aux fonctionnalités du protocole Nox. Le design Figma impose une modale custom "Sign in" avec email, passkey, login sociaux et options wallet.

## Décision

- Installer wagmi v2, viem, @rainbow-me/rainbowkit et @tanstack/react-query
- Configurer wagmi avec deux chains : Arbitrum et Arbitrum Sepolia
- Créer un composant `Providers` ("use client") wrappant WagmiProvider + RainbowKitProvider + QueryClientProvider
- Construire une modale custom `ConnectWalletModal` fidèle au design Figma (icone Nox, titre "Sign in", input email, bouton Continue, options passkey/social/WalletConnect/More Wallets, stepper)
- Appliquer un blur backdrop (backdrop-filter: blur) derrière la modale
- Modifier le Header pour ouvrir la modale au clic et afficher l'adresse tronquée une fois connecté
- Rediriger vers `/dashboard` après connexion réussie via useEffect sur isConnected
- Créer une page `/dashboard` vide comme placeholder
- Thème RainbowKit dark personnalisé aux couleurs du design system (#748eff)

## Alternatives envisagées

- Utiliser la modale par défaut de RainbowKit : rejeté car le design Figma impose une UX custom avec email, passkey et login sociaux non supportés nativement par RainbowKit.
- Utiliser wagmi seul sans RainbowKit : rejeté car RainbowKit simplifie la gestion des wallets, du chain switching et fournit des hooks utiles.

## Conséquences

- **Positif :** UX de connexion fidèle au design Figma, support multi-chain (Arbitrum + Sepolia), base solide pour toutes les futures interactions Web3
- **Négatif / Risques :** Les options email, passkey et social login seront visuelles uniquement dans un premier temps (nécessitent un provider type Web3Auth pour être fonctionnelles)
