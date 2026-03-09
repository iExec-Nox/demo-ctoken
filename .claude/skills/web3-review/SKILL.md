---
name: web3-review
description: Review Web3 integration — wallet, smart contracts, transactions, security best practices
argument-hint: [optionnel: scope — ex: "wrap", "transfer", "wallet", "all"]
allowed-tools: Read, Glob, Grep, Bash(npm *), Bash(npx *), Bash(git diff *), Bash(git status*), Agent
---

# Skill : web3-review

Review complète de l'intégration Web3 : wallet connection, smart contract calls, transaction lifecycle, input validation, gas handling, et sécurité.

## Scope

Si `$ARGUMENTS` est fourni, limiter la review au scope indiqué (ex: "wrap", "transfer", "wallet"). Sinon, tout passer en revue.

## Étapes

### 1. Identifier les fichiers Web3

Trouver tous les fichiers liés au Web3 :

```bash
# Hooks de transaction
ls hooks/use-wrap.ts hooks/use-unwrap.ts hooks/use-confidential-transfer.ts hooks/use-add-viewer.ts 2>/dev/null

# Config et libs
ls lib/wagmi.ts lib/tokens.ts lib/gas.ts lib/confidential-token-abi.ts lib/nox-compute-abi.ts 2>/dev/null

# Providers et wallet
ls components/providers.tsx components/wallet-button.tsx 2>/dev/null

# Hooks utilitaires
ls hooks/use-handle-client.ts hooks/use-token-balances.ts hooks/use-confidential-balances.ts hooks/use-invalidate-balances.ts hooks/use-estimated-fee.ts hooks/use-wallet-redirect.ts hooks/use-connect-wallet.ts 2>/dev/null
```

Utiliser aussi `Grep` pour trouver tout import de `wagmi`, `viem`, `@reown/appkit`, `@iexec-nox/handle`, `ethers` dans le projet.

Si `$ARGUMENTS` cible un scope spécifique, ne lire que les fichiers pertinents.

### 2. Checklist — Wallet Connection

Pour chaque point, lire le fichier concerné et vérifier :

- [ ] **SSR safety** : wagmi config utilise `cookieStorage` + `ssr: true`
- [ ] **Network restriction** : `allowUnsupportedChain: false` ou réseau unique
- [ ] **ProjectId valide** : pas de fallback silencieux vers un id invalide (warning si `"demo"`)
- [ ] **AppKit singleton** : flag `appKitInitialized` ou équivalent pour éviter double init
- [ ] **Theme sync** : si AppKit est utilisé, le thème est synchronisé avec le theme provider de l'app
- [ ] **Redirect post-connect** : gestion du flux connect → dashboard, disconnect → landing
- [ ] **Reconnection** : état `reconnecting` géré dans les hooks de balance/UI

### 3. Checklist — Transaction Lifecycle

Pour chaque hook de transaction (wrap, unwrap, transfer, addViewer) :

- [ ] **Approve pattern** : approve EXACT amount (pas infinite allowance) sur le bon contrat (ERC-20, pas cToken)
- [ ] **waitForTransactionReceipt** : chaque `writeContractAsync` est suivi d'un `waitForTransactionReceipt` AVANT de passer à l'étape suivante ou de marquer "confirmed"
- [ ] **Gas EIP-1559** : overrides avec buffer (Arbitrum Sepolia sous-estime)
- [ ] **Gas re-estimation** : dans les flows multi-step, les gas overrides sont re-calculés pour chaque tx (pas réutilisés)
- [ ] **User rejection** : détection des patterns `"User rejected"`, `"user rejected"`, `"denied"` → message user-friendly
- [ ] **Error truncation** : messages d'erreur longs sont tronqués (200 chars max)
- [ ] **Balance invalidation** : `invalidateBalances()` appelé après chaque tx réussie
- [ ] **Step machine** : les states suivent un flow logique (idle → ... → confirmed | error) avec un `reset()` clean
- [ ] **Event decoding** : si le flow dépend d'un event (ex: `UnwrapRequested`), le décodage utilise `decodeEventLog` avec filter sur l'adresse du contrat

### 4. Checklist — Encryption (Handle Client)

- [ ] **Lazy init** : HandleClient initialisé via React Query avec `staleTime: Infinity`
- [ ] **Cache key** : inclut `address` + `chainId` (invalide le client si le wallet change)
- [ ] **Guard** : `!handleClient` vérifié avant tout appel `encryptInput()`
- [ ] **Type parameter** : `encryptInput(amount, "uint256", contractAddress)` — le type et l'adresse du contrat sont corrects

### 5. Checklist — Input Validation & Sécurité

- [ ] **Address validation** : toute adresse utilisateur (recipient, viewer) est validée avec `isAddress()` de viem AVANT le cast `as \`0x${string}\``
- [ ] **Zero amount guard** : `parsedAmount === 0n` → erreur user-friendly AVANT d'envoyer la tx
- [ ] **Self-transfer prevention** : empêcher `recipient === address` dans le transfer (optionnel mais recommandé)
- [ ] **Placeholder filter** : les adresses placeholder (`"0x..."`) sont filtrées avant les appels contrat
- [ ] **No private keys** : aucune clé privée ou seed phrase côté client — encryption via Handle Gateway
- [ ] **No infinite approval** : approve exact amount uniquement
- [ ] **Arbiscan links** : chaque tx affiche un lien vers `sepolia.arbiscan.io/tx/{hash}` (vérifier le composant `ArbiscanLink`)

### 6. Checklist — Balance Fetching

- [ ] **Multicall** : `useReadContracts` pour batch les appels ERC-20 (pas un appel par token)
- [ ] **Guard connexion** : `query: { enabled: isReady }` — pas d'appel si wallet non connecté
- [ ] **Reconnecting** : état `reconnecting` inclus dans `isLoading`
- [ ] **Address validation** : les adresses de tokens confidentiels sont validées (pas placeholder)
- [ ] **Invalidation** : `invalidateQueries` couvre `["balance"]` + `["readContracts"]`

### 7. Checklist — Gas Estimation

- [ ] **EIP-1559** : utilisation de `estimateFeesPerGas()` (pas le legacy `gasPrice`)
- [ ] **Buffer** : multiplicateur 20% minimum pour Arbitrum Sepolia
- [ ] **Graceful fallback** : `if (!publicClient) return {}` — pas de crash si le client n'est pas dispo
- [ ] **Dynamic fee** : `useEstimatedFee` utilise `useGasPrice` pour affichage UI

### 8. Checklist — ABI & Contrats

- [ ] **`as const`** : les ABIs sont exportés `as const` (nécessaire pour le type inference wagmi/viem)
- [ ] **Séparation** : un fichier ABI par contrat
- [ ] **Adresses** : les adresses de contrats sont centralisées (pas éparpillées dans les hooks)
- [ ] **Events** : les events nécessaires sont déclarés dans l'ABI (ex: `UnwrapRequested`, `UnwrapFinalized`)

### 9. Checklist — Dépendances

- [ ] **Pas de doublon** : vérifier qu'`ethers` n'est pas utilisé si `viem` couvre tous les besoins (poids inutile ~400KB)
- [ ] **Versions compatibles** : wagmi v2 + viem v2 + @tanstack/react-query v5
- [ ] **Webpack externals** : `pino-pretty`, `lokijs`, `encoding` dans `next.config.ts` (compatibilité crypto libs)

### 10. Checklist — Architecture

- [ ] **Single source of truth** : config tokens dans `lib/tokens.ts` uniquement
- [ ] **Provider hierarchy** : `ThemeProvider` → `WagmiProvider` → `QueryClientProvider` → Modal providers
- [ ] **No prop drilling** : les modals utilisent le pattern Provider + Hook
- [ ] **Abstraction SDK** : les appels contrat sont dans des hooks dédiés, pas inline dans les composants

## Rapport

Présenter le rapport à l'utilisateur :

```
## Web3 Review

### Wallet Connection
- SSR safety : ✅ | ❌
- Network restriction : ✅ | ❌
- ProjectId : ✅ | ⚠️
- Reconnection : ✅ | ❌

### Transaction Lifecycle
- Approve pattern : ✅ | ❌
- waitForReceipt : ✅ | ❌ <détails>
- Gas EIP-1559 : ✅ | ❌
- Gas re-estimation : ✅ | ❌
- Error handling : ✅ | ❌
- Balance invalidation : ✅ | ❌

### Encryption
- HandleClient init : ✅ | ❌
- Guards : ✅ | ❌

### Input Validation & Sécurité
- Address validation : ✅ | ❌ <détails>
- Zero amount guard : ✅ | ❌
- No infinite approval : ✅ | ❌
- No private keys : ✅ | ❌

### Balance Fetching
- Multicall : ✅ | ❌
- Invalidation : ✅ | ❌

### Gas
- EIP-1559 + buffer : ✅ | ❌
- Dynamic fee UI : ✅ | ❌

### ABI & Contrats
- `as const` : ✅ | ❌
- Adresses centralisées : ✅ | ❌

### Dépendances
- Pas de doublon : ✅ | ⚠️
- Versions compatibles : ✅ | ❌

### Architecture
- Single source of truth : ✅ | ❌
- Provider hierarchy : ✅ | ❌

---

### Issues trouvées

| Priorité | Description | Fichier |
|----------|-------------|---------|
| Haute | ... | `file.ts:line` |
| Moyenne | ... | `file.ts:line` |
| Basse | ... | `file.ts:line` |

### Verdict
✅ Clean | ⚠️ Corrections recommandées | ❌ Bloquant
```

## Corrections

- Si des issues bloquantes ou hautes sont trouvées, demander : _"Je corrige ces points ?"_
- Sur validation, corriger et re-run la checklist concernée
- Boucler jusqu'à ce que tout soit vert
