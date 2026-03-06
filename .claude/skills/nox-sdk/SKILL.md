---
name: nox-sdk
description: Base de connaissances Nox SDK — utiliser pour toute intégration blockchain avec les tokens confidentiels (encrypt, decrypt, wrap/mint, unwrap/burn, transfer, ACL/viewer)
argument-hint: [action ou question sur le SDK Nox]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm *), Bash(npx *)
---

# Skill : nox-sdk — Base de connaissances Nox Protocol

Ce skill contient toutes les informations nécessaires pour intégrer le protocole Nox dans le frontend. Consulter ce fichier **avant** toute implémentation liée aux smart contracts ou au SDK.

---

## Architecture du protocole Nox

```
┌─────────────┐     encryptInput()      ┌──────────────────┐
│  Frontend    │ ──────────────────────► │  Handle Gateway   │
│  (Browser)   │ ◄────────────────────── │  (off-chain API)  │
│              │   { handle, proof }     └──────────────────┘
│              │                                  │
│              │     writeContract()              │ stocke les secrets
│              │ ──────────────────────►          │ chiffrés
│              │                         ┌──────────────────┐
│              │                         │  NoxCompute       │
│              │     decrypt()           │  (on-chain)       │
│              │ ◄────────────────────── │  0x5633...eA6     │
│              │   { value }             │  Arbitrum Sepolia  │
└─────────────┘                         └──────────────────┘
                                                 │
                                         ┌──────────────────┐
                                         │  Confidential     │
                                         │  Token Contract   │
                                         │  (ERC-7984)       │
                                         └──────────────────┘
```

### Concepts clés

- **Handle** : identifiant bytes32 référençant une valeur chiffrée stockée off-chain. Contient : chainId (octets 26-29), typeCode (octet 30), version (octet 31).
- **HandleProof** : preuve cryptographique (137 bytes, hex `0x` + 274 chars) permettant au smart contract de valider un handle venant du client.
- **NoxCompute** : smart contract central du protocole gérant ACL, opérations sur handles chiffrés, viewer management.
- **Handle Gateway** : API off-chain (`https://nox-gateway.arbitrum-sepolia-testnet.iex.ec`) qui stocke/restitue les secrets chiffrés.

---

## Packages NPM

### `@iexec-nox/handle` (v0.1.0-beta)

SDK TypeScript côté client. Peer deps : `viem ^2` (optionnel) ou `ethers ^6` (optionnel).

**Exports publics :**
```typescript
// Factory functions
export { createHandleClient } from './factories/createHandleClient.js';
export { createEthersHandleClient } from './factories/createEthersHandleClient.js';
export { createViemHandleClient } from './factories/createViemHandleClient.js';

// Types
export type {
  HandleClient,
  HandleClientConfig,
  EthersClient,
  ViemClient,
  BlockchainClient,
  Handle,
  JsValue,
  SolidityType,
  EthereumAddress,
};
```

### `@iexec-nox/nox-protocol-contracts` (v0.1.0-beta.5)

Contracts Solidity pour les smart contracts applicatifs. Contient :
- `Nox.sol` — library Solidity avec fonctions de convenance
- `INoxCompute.sol` — interface du contrat NoxCompute
- `TypeUtils.sol` — enum TEEType et utilitaires

---

## HandleClient — API complète

### Initialisation (avec viem/wagmi)

```typescript
import { createViemHandleClient } from '@iexec-nox/handle';
import type { HandleClient } from '@iexec-nox/handle';

// walletClient = viem WalletClient obtenu via wagmi
const handleClient: HandleClient = await createViemHandleClient(walletClient);
```

La factory auto-détecte le chainId et résout la config réseau. Pour Arbitrum Sepolia (421614) les defaults sont :
- `gatewayUrl`: `https://nox-gateway.arbitrum-sepolia-testnet.iex.ec`
- `smartContractAddress`: `0x5633472D35E18464CA24Ab974954fB3b1B122eA6`

Config override optionnelle :
```typescript
const handleClient = await createViemHandleClient(walletClient, {
  gatewayUrl: 'https://custom-gateway.example.com',
  smartContractAddress: '0x...',
});
```

### `encryptInput(value, solidityType, applicationContract)`

Chiffre une valeur côté client via le Gateway et retourne un handle + preuve.

```typescript
const { handle, handleProof } = await handleClient.encryptInput(
  value,        // bigint | boolean | string selon le type
  solidityType, // "uint256" | "bool" | "address" | "bytes4" | etc.
  contractAddr  // adresse du contrat qui va recevoir le handle
);
```

**Flow interne :**
1. Encode la valeur selon le solidityType
2. Récupère `owner` (adresse wallet) et `chainId`
3. `POST /v0/secrets` au Gateway avec `{ value, solidityType, applicationContract, owner }`
4. Le Gateway retourne `{ handle, proof }`
5. Valide le handle (chainId, type, version) et la preuve (137 bytes)

**Mapping type → valeur JS :**

| SolidityType | Type JS | Exemple |
|---|---|---|
| `uint8`..`uint256` | `bigint` | `1000n` |
| `int8`..`int256` | `bigint` | `-42n` |
| `bool` | `boolean` | `true` |
| `address` | `string` | `"0x742d..."` |
| `string` | `string` | `"hello"` |
| `bytes` | `string` (hex) | `"0xdeadbeef"` |
| `bytes1`..`bytes32` | `string` (hex) | `"0xab"` |

### `decrypt(handle)`

Déchiffre un handle pour un utilisateur autorisé (viewer/allowed). Requiert une signature EIP-712.

```typescript
const { value, solidityType } = await handleClient.decrypt(handle);
// value: bigint | boolean | string
// solidityType: "uint256" | "bool" | etc.
```

**Flow interne :**
1. Vérifie que le chainId du handle correspond à celui du wallet
2. Appelle `isViewer(handle, userAddress)` on-chain sur NoxCompute
3. Génère une paire de clés RSA éphémère (RSA-OAEP 2048, SHA-256)
4. Signe un message EIP-712 `DataAccessAuthorization` contenant :
   - `userAddress`, `encryptionPubKey` (RSA pub en hex SPKI), `notBefore` (now), `expiresAt` (now + 3600s)
   - Domain: `{ name: "Handle Gateway", version: "1", chainId, verifyingContract: noxComputeAddress }`
5. `GET /v0/secrets/{handle}` avec header `Authorization: EIP712 <base64(payload+signature)>`
6. Reçoit `{ ciphertext, iv, encryptedSharedSecret }`
7. Déchiffre le shared secret via RSA, puis déchiffre le ciphertext via ECIES (AES-GCM-256 avec HKDF)
8. Decode la valeur selon le solidityType du handle

**Le decrypt nécessite :**
- L'utilisateur doit être **viewer** du handle (owner, allowed, ou ajouté via `addViewer`)
- Une **signature wallet** (popup MetaMask pour EIP-712)
- L'utilisateur **décide** quand déchiffrer (icône oeil dans l'UI)

---

## ABI ERC-7984 Confidential Token (cRLC — vérifié on-chain)

L'ABI du smart contract de token confidentiel. **Extraite des selectors du contrat déployé** (`0x271f...`), pas du memo SDK (qui est obsolète sur ce point).

```typescript
export const confidentialTokenAbi = [
  // Metadata
  { inputs: [], name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "pure", type: "function" },
  { inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], stateMutability: "pure", type: "function" },

  // Balance & Supply (retournent des handles bytes32, PAS des valeurs)
  { inputs: [{ name: "account", type: "address" }], name: "confidentialBalanceOf", outputs: [{ name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "confidentialTotalSupply", outputs: [{ name: "", type: "bytes32" }], stateMutability: "view", type: "function" },

  // Wrap: lock ERC-20 + mint cToken (montant en CLAIR, pas de handle)
  { inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "wrap", outputs: [], stateMutability: "nonpayable", type: "function" },

  // Unwrap step 1: initiate (handle + proof du montant chiffré)
  { inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "encryptedAmount", type: "bytes32" }, { name: "inputProof", type: "bytes" }], name: "unwrap", outputs: [], stateMutability: "nonpayable", type: "function" },

  // Unwrap step 2: finalize (même handle, montant en clair, preuve de déchiffrement)
  { inputs: [{ name: "handle", type: "bytes32" }, { name: "clearAmount", type: "uint256" }, { name: "decryptionProof", type: "bytes" }], name: "finalizeUnwrap", outputs: [], stateMutability: "nonpayable", type: "function" },

  // Transfer confidentiel (toujours avec proof)
  { inputs: [{ name: "to", type: "address" }, { name: "encryptedAmount", type: "bytes32" }, { name: "inputProof", type: "bytes" }], name: "confidentialTransfer", outputs: [], stateMutability: "nonpayable", type: "function" },

  // Utilitaire unwrap
  { inputs: [{ name: "handle", type: "bytes32" }], name: "unwrapRequester", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
] as const;
```

**Important :**
- **Wrap prend un montant en clair** (`uint256`), PAS un handle. Pas de `encryptInput` pour le wrap.
- **Unwrap est en 2 étapes** : `unwrap()` puis `finalizeUnwrap()`. L'utilisateur appelle les deux.
- `finalizeUnwrap.decryptionProof` : **mock data** (`"0x00"`) dans l'immédiat (devs en cours).
- `confidentialBalanceOf` et `confidentialTotalSupply` retournent des **handles** (bytes32). Appeler `handleClient.decrypt(handle)` pour obtenir la valeur.
- Le handle de balance **change après chaque transaction**. Il faut le relire à chaque fois.
- Le memo SDK documente `mint`/`burn` mais le contrat déployé utilise `wrap`/`unwrap`/`finalizeUnwrap`.
- Toujours utiliser les variantes **avec proof** (bytes). Les versions sans proof existent mais ne sont pas utilisées.

---

## Flows d'intégration frontend

### Architecture Lock/Mint — Unlock/Burn

```
ERC-20 (RLC)              Wrapped ERC-7984 (cRLC)
┌─────────────┐           ┌─────────────────┐
│  Lock       │── Wrap ──>│  Mint (interne) │
│  Unlock     │<─ Unwrap ─│  Burn (interne) │
└─────────────┘           └─────────────────┘
```

- Il n'y a PAS de transfer entre ERC-20 et ERC-7984. Ce sont 2 registres indépendants.
- Wrap = lock côté ERC-20 + mint côté cToken
- Unwrap = burn côté cToken + unlock côté ERC-20

### Wrap (public ERC-20 → cToken)

Le wrap prend un montant **en clair**. Pas besoin de `encryptInput`.

```typescript
import { erc20Abi, parseUnits } from "viem";

// 1. Approve EXACT amount sur le contrat ERC-20 (PAS d'infinite approval)
await writeContract({
  address: RLC_ADDRESS,
  abi: erc20Abi,
  functionName: "approve",
  args: [cRLC_ADDRESS, parseUnits(amount, 9)],
});

// 2. Wrap sur le contrat confidentiel (montant en clair)
await writeContract({
  address: cRLC_ADDRESS,
  abi: confidentialTokenAbi,
  functionName: "wrap",
  args: [userAddress, parseUnits(amount, 9)],
});
// Le contrat cRLC appelle RLC.transferFrom() en interne pour lock les tokens
```

### Unwrap (cToken → public ERC-20) — 2 étapes

```typescript
// 1. Chiffrer le montant via le SDK
const { handle, handleProof } = await handleClient.encryptInput(
  parseUnits(amount, 9), // bigint
  "uint256",
  cRLC_ADDRESS
);

// 2. Initier l'unwrap (from et to = même adresse = msg.sender)
await writeContract({
  address: cRLC_ADDRESS,
  abi: confidentialTokenAbi,
  functionName: "unwrap",
  args: [userAddress, userAddress, handle, handleProof],
});

// 3. Finaliser l'unwrap (même handle, montant en clair, preuve mockée)
await writeContract({
  address: cRLC_ADDRESS,
  abi: confidentialTokenAbi,
  functionName: "finalizeUnwrap",
  args: [handle, parseUnits(amount, 9), "0x00"], // decryptionProof = mock
});
```

### Confidential Transfer

```typescript
// 1. Chiffrer le montant
const { handle, handleProof } = await handleClient.encryptInput(
  parseUnits(amount, 9),
  "uint256",
  cRLC_ADDRESS
);

// 2. Transfer confidentiel
await writeContract({
  address: cRLC_ADDRESS,
  abi: confidentialTokenAbi,
  functionName: "confidentialTransfer",
  args: [recipientAddress, handle, handleProof],
});
```

### Lire et déchiffrer une balance

```typescript
// 1. Lire le handle de balance (bytes32)
const balanceHandle = await readContract({
  address: cRLC_ADDRESS,
  abi: confidentialTokenAbi,
  functionName: "confidentialBalanceOf",
  args: [userAddress],
});

// 2. Vérifier que le handle est initialisé (non-zero)
const isZero = balanceHandle === "0x" + "0".repeat(64);

// 3. Déchiffrer uniquement quand l'utilisateur clique (icône oeil)
if (!isZero) {
  const { value } = await handleClient.decrypt(balanceHandle);
  // value = bigint (ex: 1000000000n pour 1 RLC avec 9 decimals)
  const formatted = formatUnits(value as bigint, 9);
}
```

### Selective Disclosure (addViewer)

L'ACL fonctionne **par handle** (pas par token global). L'utilisateur autorise un viewer sur son handle de balance actuel.

**Points en attente :**
- Le mécanisme exact d'ajout de viewer depuis le frontend (appel direct à NoxCompute ou via le token contract ?)
- Pas de `removeViewer` dans le contrat actuel — revoke non supporté pour l'instant
- Le viewer doit être ajouté **à chaque nouveau handle** (après chaque tx qui modifie la balance)

---

## Contrats — Adresses

| Contrat | Adresse | Chain |
|---------|---------|-------|
| **NoxCompute** | `0x5633472D35E18464CA24Ab974954fB3b1B122eA6` | Arbitrum Sepolia (421614) |
| **Gateway** | `https://nox-gateway.arbitrum-sepolia-testnet.iex.ec` | — |
| **RLC** (ERC-20) | `0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963` | Arbitrum Sepolia (421614) |
| **cRLC** (ERC-7984) | `0x271f46e78f2fe59817854dabde47729ac4935765` | Arbitrum Sepolia (421614) |

- `cRLC.underlying()` → `0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963` (RLC) — confirmé on-chain
- RLC : decimals=9, symbol="RLC", name="iEx.ec Network Token" (proxy upgradeable)
- cRLC : decimals=9, symbol="cRLC", name="Confidential RLC"
- USDC/cUSDC : pas encore déployé

---

## Intégration wagmi React — Pattern recommandé

### Hook useHandleClient

```typescript
import { useWalletClient } from "wagmi";
import { createViemHandleClient, type HandleClient } from "@iexec-nox/handle";

export function useHandleClient() {
  const { data: walletClient } = useWalletClient();
  const [handleClient, setHandleClient] = useState<HandleClient | null>(null);

  useEffect(() => {
    if (!walletClient) {
      setHandleClient(null);
      return;
    }
    createViemHandleClient(walletClient)
      .then(setHandleClient)
      .catch(() => setHandleClient(null));
  }, [walletClient]);

  return handleClient;
}
```

**Note :** `useWalletClient()` de wagmi retourne un `WalletClient` viem compatible avec `createViemHandleClient()`. Pas besoin de `.extend(walletActions)` comme dans le projet Vue — wagmi le fait déjà.

---

## Structure du handle (bytes32)

```
Octets 0-25  : identifiant unique du secret (26 bytes)
Octets 26-29 : chainId (4 bytes, big-endian) — ex: 0x00066EEE = 421614
Octet  30    : typeCode — index dans TEEType enum (ex: 35 = Uint256)
Octet  31    : version (actuellement 0)
```

Fonctions utilitaires exposées par le SDK :
- `handleToChainId(handle)` → `number`
- `handleToSolidityType(handle)` → `SolidityType`
- `handleToVersion(handle)` → `number`

---

## Sécurité & contraintes

- **encryptInput** transmet le plaintext au Gateway via TLS — le Gateway est un tiers de confiance (TEE)
- **decrypt** requiert une signature EIP-712 du wallet — popup MetaMask à chaque déchiffrement
- Le handle proof expire (durée configurable côté NoxCompute via `proofExpirationDuration`)
- Le SDK utilise `crypto.subtle` (Web Crypto API) → fonctionne dans le navigateur, **pas en SSR**
- Utilise `fetch`, `btoa`, `TextEncoder` → APIs navigateur standard
- **Ne pas importer le SDK côté serveur** (Next.js SSR). Utiliser uniquement dans des composants `"use client"` ou dans des hooks client-side.

---

## Points clarifiés

1. **Approve** : c'est un ERC-20 `approve()` classique sur le token public (RLC), pour le montant exact (PAS infinite approval). Le contrat cRLC appelle ensuite `transferFrom()`.
2. **Adresses cRLC** : `0x271f46e78f2fe59817854dabde47729ac4935765` — confirmé on-chain
3. **`wrap` vs `mint`** : le contrat déployé utilise `wrap(address, uint256)` avec montant en clair, PAS `mint(address, bytes32, bytes)` du memo
4. **`unwrap` = 2 étapes** : `unwrap()` + `finalizeUnwrap()`. La preuve de déchiffrement dans `finalizeUnwrap` est mockée (`"0x00"`) pour l'instant.
5. **`setOperator`** = comme approve mais montant infini pour une durée limitée (uint48 = timestamp expiration). Pas nécessaire en v1.

## Points en attente

1. **Selective Disclosure** — comment appeler `addViewer` depuis le frontend (ABI du token ? appel direct NoxCompute ?)
2. **Subgraph** pour l'Activity Explorer — sera fourni (user peut partager la doc)
3. **Events** — émis par NoxCompute, pas par le token. Seront consommés via subgraph.
4. **Compatibilité SSR** du SDK — à tester lors de l'intégration
5. **USDC/cUSDC** — pas encore déployé, on implémente d'abord avec RLC/cRLC
6. **`finalizeUnwrap` decryptionProof** — les devs travaillent encore dessus, mock data pour l'instant
