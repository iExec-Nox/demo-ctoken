---
name: review
description: Vérifie que l'implémentation respecte les standards du projet (build, lint, conventions)
argument-hint: [optionnel: scope à review]
allowed-tools: Read, Glob, Grep, Bash(npm *), Bash(git diff *), Bash(git status*), Task, mcp__ide__getDiagnostics
---

# Skill : review

Passe en revue l'implémentation pour vérifier la qualité, les conventions et le bon fonctionnement.

## Étapes

### 1. Identifier les fichiers changés

```bash
git diff --name-only HEAD
git diff --staged --name-only
git status
```

Si `$ARGUMENTS` est fourni, limiter le scope aux fichiers correspondants.

### 2. Checks automatiques

Exécuter en parallèle :

```bash
npm run build
npm run lint
npx tsc --noEmit
```

Collecter les résultats :
- **Build** : ✅ OK ou ❌ liste des erreurs
- **Lint** : ✅ OK ou ❌ liste des warnings/erreurs
- **Types** : ✅ OK ou ❌ liste des erreurs TypeScript

### 3. Review des conventions

Pour chaque fichier modifié/créé, vérifier :

#### Nommage
- [ ] Fichiers en **kebab-case** (ex: `token-card.tsx`, pas `TokenCard.tsx`)
- [ ] Composants exportés en **PascalCase**
- [ ] Hooks préfixés par `use` (ex: `useWallet`)

#### Structure
- [ ] Un composant par fichier (single responsibility)
- [ ] Sub-composants extraits si logique répétée
- [ ] Imports via alias `@/` et non chemins relatifs profonds

#### Design system
- [ ] Utilisation de shadcn/ui quand un composant existe
- [ ] Couleurs via CSS variables (pas de valeurs hardcodées)
- [ ] Responsive : classes Tailwind mobile-first si applicable

#### Sécurité
- [ ] Pas de secrets/clés hardcodés
- [ ] Pas de `dangerouslySetInnerHTML` sans sanitization
- [ ] Pas d'injection possible (XSS, etc.)

### 4. Lire et analyser les fichiers

Pour chaque fichier modifié, lire le contenu et vérifier manuellement les points ci-dessus. Signaler tout écart.

### 5. Rapport de review

Présenter le rapport à l'utilisateur :

```
📋 Review terminée !

## Checks automatiques
- Build : ✅ | ❌
- Lint : ✅ | ❌
- Types (tsc) : ✅ | ❌

## Conventions
- Nommage : ✅ | ⚠️ <détails>
- Structure : ✅ | ⚠️ <détails>
- Design system : ✅ | ⚠️ <détails>
- Sécurité : ✅ | ⚠️ <détails>

## Problèmes trouvés
1. <description du problème> — <fichier:ligne>
2. ...

## Verdict
✅ Prêt à commit | ⚠️ Corrections nécessaires
```

### 6. Corrections si nécessaire

- Si des problèmes sont trouvés, demander à l'utilisateur : _"Je corrige ces points ?"_
- Sur validation, corriger et re-run les checks
- Boucler jusqu'à ce que tout soit vert
