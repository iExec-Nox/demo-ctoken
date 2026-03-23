# ADR-0018 : Migration de Reown AppKit vers Alchemy Account Kit

**Date :** 2026-03-23
**Statut :** En cours (implémenté, en test sur Arbitrum Sepolia)

## Contexte

L'application utilisait **Reown AppKit** (ex-WalletConnect AppKit, voir ADR-0001) pour la connexion wallet. Reown gère uniquement des wallets EOA (Externally Owned Accounts) : MetaMask, Rabby, Coinbase Wallet, WalletConnect.

Pour supporter l'**Account Abstraction (ERC-4337)** et offrir une onboarding simplifiée (connexion par email, social login Google/Apple, passkey), la décision a été prise de migrer vers **Alchemy Account Kit v4** (`@account-kit/react`).

### Objectifs

- Connexion sans wallet externe (email, Google, Apple)
- Support des Smart Contract Accounts (SCA) via ERC-4337
- Gas sponsoring via Alchemy Gas Manager (l'utilisateur ne paie pas le gas)
- Conservation du support EOA (wallets externes via WalletConnect)

---

## Concepts clés : Account Abstraction

### Deux types de comptes

| | EOA (Externally Owned Account) | SCA (Smart Contract Account) |
|---|---|---|
| **Contrôle** | Clé privée détenue par l'utilisateur | Smart contract on-chain contrôlé par un signer |
| **Exemples** | MetaMask, Rabby | Alchemy LightAccount, Modular Account |
| **Transactions** | Signées et envoyées directement | Envoyées comme UserOperations via un Bundler ERC-4337 |
| **Gas** | Payé par l'utilisateur | Peut être sponsorisé par un Paymaster |
| **Adresse** | = clé publique du signer | Adresse déterministe dérivée du signer + type de compte + factory |

### Architecture SCA (ERC-4337)

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Account Kit hooks)                                │
│  useSmartAccountClient + useSendUserOperation                │
└──────────────────────┬──────────────────────────────────────┘
                       │ UserOperation
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Alchemy Bundler (arb-sepolia.g.alchemy.com)                 │
│  - Valide l'UserOperation                                    │
│  - Estime le gas                                             │
│  - Demande le sponsoring au Paymaster                        │
│  - Soumet la tx on-chain via EntryPoint                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  EntryPoint Contract (0x5FF1...2789)                         │
│  - Vérifie la signature (ERC-1271 pour SCA)                  │
│  - Exécute l'UserOperation via le Smart Account              │
│  - Le Smart Account appelle le contrat cible (wrap, transfer)│
└──────────────────────────────────────────────────────────────┘
```

### Signer vs Smart Account : distinction critique

```
Signer (Alchemy Embedded Wallet)
├── Adresse : 0xEC46... (clé EOA interne, gérée par Alchemy)
├── Rôle : signe les UserOperations
├── NE détient PAS de fonds
└── Retourné par useUser().address

Smart Account (LightAccount on-chain)
├── Adresse : 0xB538... (déterministe : signer + type + factory)
├── Rôle : exécute les transactions (msg.sender on-chain)
├── Détient les fonds (ERC-20, cTokens)
└── Retourné par useAccount({ type: "LightAccount" }).address
```

**Règle fondamentale :** Les tokens doivent être envoyés à l'adresse du **Smart Account**, pas du signer. C'est le Smart Account qui est `msg.sender` lors des appels `approve`, `wrap`, `transfer`.

---

## Décision

### Packages installés

```json
{
  "@account-kit/infra": "^4.86.0",
  "@account-kit/react": "^4.86.0"
}
```

**Package supprimé :** `permissionless` — remplacé entièrement par Account Kit.

### Type de compte : `LightAccount`

Account Kit supporte 4 types de smart accounts :

| Type | Caractéristiques |
|------|-----------------|
| **ModularAccountV2** | Défaut Account Kit, ERC-6900, modules, session keys |
| **LightAccount** | Minimaliste, single-owner, léger en gas |
| MultiOwnerLightAccount | LightAccount multi-signataire |
| MultiOwnerModularAccount | Modular Account multi-signataire |

**Choix : `LightAccount`** car `ModularAccountV2` n'est pas encore disponible sur Arbitrum Sepolia (retourne une adresse vide).

La constante `ACCOUNT_TYPE` est exportée depuis `hooks/use-wallet-auth.ts` et utilisée par tous les hooks pour garantir la cohérence :

```ts
// hooks/use-wallet-auth.ts
export const ACCOUNT_TYPE = "LightAccount" as const;
```

> **Attention :** Changer `ACCOUNT_TYPE` après déploiement change l'adresse du smart account de tous les utilisateurs. Les fonds sur l'ancienne adresse ne sont pas transférés automatiquement.

### Configuration Alchemy

```ts
// lib/alchemy.ts
export const alchemyConfig = createConfig(
  {
    transport: alchemy({ apiKey: CONFIG.alchemy.apiKey }),
    chain: arbitrumSepolia,
    policyId: CONFIG.alchemy.policyId || undefined,  // Gas Manager policy
    ssr: true,
  },
  {
    auth: {
      sections: [
        [{ type: "email" }],
        [
          { type: "social", authProviderId: "google", mode: "popup" },
          { type: "social", authProviderId: "apple", mode: "popup" },
        ],
        [{ type: "external_wallets", walletConnect: { projectId } }],
      ],
      addPasskeyOnSignup: false,
    },
  }
);
```

### Variables d'environnement requises

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=xxx          # Clé API Alchemy (dashboard.alchemy.com)
NEXT_PUBLIC_ALCHEMY_POLICY_ID=xxx        # Policy ID du Gas Manager (sponsoring)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx # Pour les wallets externes (cloud.reown.com)
```

### Hiérarchie des providers

```
ThemeProvider
  └─ QueryClientProvider
       └─ AlchemyAccountProvider        ← Account Kit (auth, signer, SCA)
            └─ WagmiProvider             ← config extraite d'Account Kit
                 └─ TooltipProvider
                      └─ FaucetModalProvider
                           └─ WrapModalProvider
                                └─ TransferModalProvider
                                     └─ SelectiveDisclosureModalProvider
```

`WagmiProvider` utilise `alchemyConfig._internal.wagmiConfig` pour que wagmi et Account Kit partagent la même instance de transport et de query client.

---

## Architecture des hooks

### `useWalletAuth` — Point d'entrée unifié

Abstrait les différences EOA/SCA pour le reste de l'application.

```ts
interface UseWalletAuthResult {
  isConnected: boolean;
  address: `0x${string}` | undefined;              // Signer address
  smartAccountAddress: `0x${string}` | undefined;   // Smart account (SCA only)
  type: "eoa" | "sca" | undefined;
  status: WalletStatus;
  logout: () => void;
  connect: () => void;
}
```

- `address` = `useUser().address` → adresse du signer (EOA interne Alchemy)
- `smartAccountAddress` = `useAccount({ type: ACCOUNT_TYPE }).address` → adresse du smart account on-chain
- Pour les hooks consommateurs : `type === "sca" ? smartAccountAddress : address` donne l'adresse on-chain

### `useWriteTransaction` — Envoi de transactions unifié

```ts
function useWriteTransaction(): {
  writeTransaction: (params: WriteTransactionParams) => Promise<`0x${string}`>;
  waitForReceipt: (hash: `0x${string}`) => Promise<TransactionReceipt>;
  publicClient: PublicClient | undefined;
}
```

Deux chemins internes :

| | EOA | SCA |
|---|---|---|
| **Mécanisme** | `wagmi.writeContractAsync()` | `sendUserOperationAsync()` via Account Kit |
| **Signature** | Wallet externe (MetaMask, etc.) | Alchemy signer (invisible pour l'utilisateur) |
| **Gas** | Payé par l'utilisateur | Sponsorisé par Gas Manager |
| **msg.sender** | Adresse EOA | Adresse Smart Account |

Le path SCA utilise Account Kit nativement :

```ts
const { client } = useSmartAccountClient({ type: ACCOUNT_TYPE });
const { sendUserOperationAsync } = useSendUserOperation({ client, waitForTxn: true });

// Appel :
const result = await sendUserOperationAsync({
  uo: { target: contractAddress, data: encodedCalldata, value: 0n },
});
return result.hash;  // tx hash on-chain
```

`waitForTxn: true` signifie que `sendUserOperationAsync` attend que l'UserOperation soit minée et retourne directement le hash de la transaction on-chain.

### `useHandleClient` — Client de déchiffrement (Nox SDK)

Le handle client nécessite un objet capable de `signTypedData` pour déchiffrer les balances confidentielles.

- **EOA :** utilise le `walletClient` wagmi directement
- **SCA :** utilise l'instance `account` retournée par `useAccount({ type: ACCOUNT_TYPE })`, qui signe via le signer Alchemy avec vérification ERC-1271

### Hooks consommateurs (inchangés)

Les hooks métier (`useWrap`, `useUnwrap`, `useConfidentialTransfer`, `useAddViewer`) n'ont pas été modifiés. Ils appellent `useWriteTransaction().writeTransaction()` qui route automatiquement vers le bon chemin EOA/SCA.

```
useWrap / useUnwrap / useConfidentialTransfer / useAddViewer
    │
    ▼
useWriteTransaction (routage EOA/SCA transparent)
    │
    ├── EOA → wagmi writeContractAsync
    └── SCA → Account Kit sendUserOperationAsync
```

---

## Intégration CSS : isolation Tailwind v3 / v4

### Problème

Account Kit (`@account-kit/react/styles.css`) embarque du CSS basé sur **Tailwind v3** incluant un reset CSS complet. Notre application utilise **Tailwind v4**. L'import direct du CSS Account Kit écrase les utilities Tailwind v4, cassant le styling de toute l'application (boutons, inputs, layouts).

### Solution : CSS Cascade Layers

La stratégie utilise les [CSS Cascade Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) pour isoler les deux frameworks CSS.

**Ordre des imports dans `app/globals.css` :**

```css
@import "@account-kit/react/styles.css" layer(account-kit);  /* 1. Layer bas — reset isolé */
@import "tailwindcss";                                         /* 2. Tailwind v4 utilities */
@import "./account-kit-ui.css";                                /* 3. Unlayered — plus haute priorité */
```

| Import | Layer | Priorité | Rôle |
|--------|-------|----------|------|
| `@account-kit/react/styles.css` | `layer(account-kit)` | Basse | Reset CSS Tailwind v3 isolé — n'écrase pas Tailwind v4 |
| `tailwindcss` | (défaut) | Normale | Utilities Tailwind v4 du projet |
| `./account-kit-ui.css` | Aucun (unlayered) | Haute | Styles des composants Account Kit (`.akui-*`) |

**Pourquoi ça marche :** En CSS, le contenu sans layer (`unlayered`) a toujours priorité sur le contenu dans un layer. Le reset de Tailwind v3 dans `layer(account-kit)` ne peut donc jamais écraser les utilities Tailwind v4, tandis que les styles `.akui-*` (unlayered) s'appliquent correctement aux composants Account Kit.

### Fichier `app/account-kit-ui.css` (612 lignes)

Styles des composants UI de la modale d'authentification Account Kit, extraits de `@account-kit/react/styles.css` et importés hors layer pour garantir leur application.

**Variables CSS (light/dark mode) :**

Les variables suivent le pattern `--akui-*` et s'adaptent au thème via `:root:is(.dark, .dark *)` et `@media (prefers-color-scheme: dark)` :

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--akui-btn-primary` | `#E82594` | `#FF66CC` | Bouton principal (rose Alchemy) |
| `--akui-btn-secondary` | `#E2E8F0` | `#374151` | Bouton secondaire |
| `--akui-btn-auth` | `#FFF` | `rgba(255,255,255,0.05)` | Bouton OAuth (Google, Apple) |
| `--akui-fg-primary` | `#020617` | `#fff` | Texte principal |
| `--akui-fg-secondary` | `#475569` | `#E2E8F0` | Texte secondaire |
| `--akui-fg-accent-brand` | `#E82594` | `#FF66CC` | Liens, accents |
| `--akui-bg-surface-default` | `#fff` | `#020617` | Fond de la modale |
| `--akui-bg-surface-subtle` | `#FBFDFF` | `#0F172A` | Fond de section |
| `--akui-bg-surface-inset` | `#EFF4F9` | `#1F2937` | Fond d'input désactivé |
| `--akui-static` | `#CBD5E1` | `#374151` | Bordures |
| `--akui-critical` | `#F87171` | `#DC2626` | États d'erreur |
| `--akui-border-radius-base` | `8px` | `8px` | Rayon de base (×1 pour inputs, ×2 pour modale) |

**Composants stylisés :**

| Sélecteur | Rôle |
|-----------|------|
| `.akui-modal` | Conteneur modale (border-radius ×2, fond surface) |
| `.akui-btn` | Bouton de base (40px, transitions, hover shadow) |
| `.akui-btn-primary` | Bouton rose Alchemy (CTA) |
| `.akui-btn-secondary` | Bouton secondaire |
| `.akui-btn-auth` | Bouton OAuth avec bordure (Google, Apple, WalletConnect) |
| `.akui-btn-link` | Lien stylisé en bouton |
| `.akui-input` | Input de base (40px, bordure, focus/error states) |
| `.akui-form-controls` | Layout formulaire (flex column, gap) |
| `.akui-form-label` | Label de formulaire |
| `.akui-form-hint` | Texte d'aide / erreur sous l'input |
| `.akui-btn-group` | Groupe de boutons (flex, wrap, gap) |

### Impact zéro sur le design system existant

- Les tokens CSS Nox (`--background`, `--foreground`, `--primary`, etc.) dans `globals.css` sont **inchangés**
- Les composants shadcn/ui ne sont pas affectés (ils utilisent les tokens Nox, pas `--akui-*`)
- Aucune modification de `postcss.config.mjs` ni de la config Tailwind

---

## Fichiers impactés

| Fichier | Rôle | Changement |
|---------|------|------------|
| `lib/alchemy.ts` | Config Account Kit | Nouveau fichier |
| `lib/config.ts` | Config centralisée | Ajout `alchemy.apiKey`, `alchemy.policyId` |
| `lib/smart-account.ts` | Utilitaires client | Nettoyé — ne contient plus que `createTenderlyPublicClient` |
| `components/providers.tsx` | Provider tree | `AlchemyAccountProvider` + wagmi via Account Kit |
| `hooks/use-wallet-auth.ts` | Auth unifié | `useAccount()` Account Kit au lieu de permissionless |
| `hooks/use-write-transaction.ts` | Envoi tx | `useSmartAccountClient` + `useSendUserOperation` |
| `hooks/use-handle-client.ts` | Client decrypt | `useAccount()` Account Kit au lieu de permissionless |
| `app/globals.css` | Imports CSS | +2 imports (Account Kit layer + UI styles) |
| `app/account-kit-ui.css` | Styles modale auth | Nouveau fichier (612 lignes) — composants `.akui-*` |
| `package.json` | Dépendances | +`@account-kit/*`, -`permissionless`, -`@reown/appkit*` |

---

## Piège rencontré : mismatch d'adresse smart account

### Problème

Initialement, les UserOperations étaient envoyées via un `bundlerClient` construit avec la librairie `permissionless` (`toLightSmartAccount`). L'adresse du smart account permissionless (`0x28FA...`) ne correspondait **pas** à celle d'Account Kit (`0xB538...`) car les deux utilisent des **factory contracts différentes**.

Résultat : les UserOps étaient acceptées par le bundler Alchemy mais jamais minées (l'account cible n'existait pas on-chain).

### Diagnostic

```
useUser().address:                    0xEC469...  (signer)
useAccount("LightAccount").address:   0xB538...  (Account Kit factory)
permissionless toLightSmartAccount:   0x28FA...  (permissionless factory)
                                      ≠ ≠ ≠
```

### Solution

Ne **jamais** construire de smart account manuellement. Utiliser exclusivement les hooks Account Kit (`useSmartAccountClient`, `useSendUserOperation`, `useAccount`) qui garantissent la cohérence des adresses.

---

## Alternatives envisagées

| Alternative | Raison du rejet |
|-------------|----------------|
| **Rester sur Reown AppKit** | Pas de support Account Abstraction, pas de connexion email/social native |
| **permissionless + viem bundler client** | Mismatch de factory address avec Account Kit — adresses incohérentes |
| **Account Kit avec ModularAccountV2** | Pas encore disponible sur Arbitrum Sepolia (adresse vide) |
| **EIP-7702 (Account Kit v5)** | SDK v5 (`@alchemy/wallet-apis`) pas encore stable, migration trop lourde |

---

## Conséquences

### Positif

- **Onboarding simplifié :** connexion par email, Google, Apple — pas besoin d'installer MetaMask
- **Gas sponsoring :** l'utilisateur ne paie pas le gas (Alchemy Gas Manager)
- **Architecture propre :** les hooks métier ne connaissent pas le type de compte — `useWriteTransaction` abstrait tout
- **Adresse stable :** même signer + même `ACCOUNT_TYPE` = même adresse déterministe à chaque session
- **Code réduit :** -209 lignes, suppression de `permissionless`, plus de gestion manuelle bundler/paymaster/gas

### Négatif / Risques

- **Vendor lock-in Alchemy :** toute l'infra AA (bundler, paymaster, signer) dépend d'Alchemy
- **`ACCOUNT_TYPE` immutable en production :** changer le type de compte change l'adresse → perte d'accès aux fonds
- **Faucet UX :** les utilisateurs SCA doivent envoyer les tokens faucet à leur adresse smart account, pas à l'adresse affichée par `useUser()` (signer)
- **`ModularAccountV2` non testé :** quand il sera disponible sur Arb Sepolia, il faudra évaluer si la migration vaut le coup (session keys, modules)

### À surveiller

- Disponibilité de `ModularAccountV2` sur Arbitrum Sepolia
- Migration vers Account Kit v5 (`@alchemy/wallet-apis`) qui utilise EIP-7702 (signer address = smart account address)
- Vérifier que le handle client Nox SDK fonctionne correctement avec le `account` retourné par `useAccount` (signature ERC-1271)
