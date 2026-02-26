---
name: build
description: Implémente le plan validé en respectant les conventions du projet
argument-hint: [optionnel: précision sur ce qu'il faut implémenter]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm *), Bash(npx *), Bash(curl *), Task, mcp__figma-desktop__get_design_context, mcp__figma-desktop__get_screenshot
---

# Skill : build

Implémente le plan validé étape par étape en respectant les conventions du projet.

## Prérequis

- Un plan doit avoir été validé dans la conversation (via `/plan` ou discussion directe)
- Si aucun plan n'est trouvé, **STOP** et demander : _"Aucun plan validé trouvé. Utilise `/plan` d'abord ou décris ce que tu veux implémenter."_

## Étapes

### 1. Identifier le plan validé

- Remonter dans la conversation pour trouver le dernier plan validé
- Extraire les étapes d'implémentation et les fichiers impactés

### 2. Charger les conventions

Avant de coder, relire :
- `CLAUDE.md` — conventions globales du projet
- `components/CLAUDE.md` — conventions composants, design system, nommage

Règles clés à respecter :
- **Fichiers** : kebab-case (ex: `token-card.tsx`)
- **Composants** : PascalCase (ex: `TokenCard`)
- **Sub-composants** : extraire la logique répétée dans des composants dédiés (single responsibility)
- **Imports** : utiliser les alias `@/` configurés
- **shadcn/ui** : utiliser les composants existants avant d'en créer
- **Mock data** : si les contrats ne sont pas prêts, utiliser `lib/nox-sdk-mock.ts`

### 3. Implémenter étape par étape

Pour chaque étape du plan :

1. **Annoncer** l'étape en cours : _"Étape N/M : <description>"_
2. **Lire** les fichiers existants avant de modifier
3. **Implémenter** en suivant les conventions
4. **Vérifier** que le code compile (pas d'erreurs de syntaxe évidentes)

Ordre d'implémentation recommandé :
1. `lib/` — utilitaires, SDK, types
2. `hooks/` — hooks custom
3. `components/` — composants réutilisables
4. `app/` — pages et layouts

### 4. Vérification rapide

Après l'implémentation complète :

```bash
npm run build
```

- Si le build échoue, corriger les erreurs immédiatement
- Ne PAS passer à l'étape suivante avec un build cassé

### 5. Récapitulatif

```
🔨 Implémentation terminée !
   Étapes complétées : <n>/<total>
   Fichiers créés : <liste>
   Fichiers modifiés : <liste>
   Build : ✅ OK | ❌ Erreurs à corriger
```
