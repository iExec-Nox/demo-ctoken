---
name: clean
description: Audit complet du code — Next.js, React, qualité, performance et accessibilité
argument-hint: [optionnel: scope — fichier, dossier ou feature à auditer]
allowed-tools: Read, Glob, Grep, Bash(npm *), Bash(npx *), Bash(git diff *), Bash(git status*), Task, Skill, mcp__ide__getDiagnostics
---

# Skill : clean

Audit complet du code pour garantir qu'il respecte les best practices Next.js, React/Vercel, et les standards de qualité. Détecte le dead code, les redondances, les anti-patterns et les problèmes de performance.

## Scope

- Si `$ARGUMENTS` est fourni → limiter l'audit aux fichiers correspondants
- Sinon → auditer les fichiers modifiés (`git diff --name-only HEAD~5`) + tous les fichiers du projet (`components/`, `app/`, `hooks/`, `lib/`)

## Étapes

### 1. Collecter les fichiers à auditer

```bash
git diff --name-only HEAD~5   # fichiers récemment modifiés
git status --short             # fichiers non commités
```

Compléter avec un Glob sur le scope complet si pas de `$ARGUMENTS` :
```
app/**/*.{ts,tsx}
components/**/*.tsx
hooks/**/*.ts
lib/**/*.ts
```

### 2. Checks automatiques

Exécuter en parallèle :

```bash
npm run build
npm run lint
```

Collecter les résultats :
- **Build** : ✅ OK ou ❌ liste des erreurs
- **Lint** : ✅ OK ou ❌ liste des warnings/erreurs

Également récupérer les diagnostics IDE :
```
mcp__ide__getDiagnostics
```

---

### 3. Next.js Best Practices

Pour chaque fichier dans `app/` et `components/`, vérifier :

#### Server vs Client Components
- [ ] `"use client"` uniquement sur les composants qui en ont **besoin** (hooks, event handlers, browser APIs)
- [ ] Pas de `"use client"` sur des composants qui pourraient être Server Components
- [ ] Les Server Components ne passent pas de fonctions sérialisables aux Client Components

#### Routing & Metadata
- [ ] Les `page.tsx` exportent des `metadata` ou `generateMetadata` quand pertinent
- [ ] Les `layout.tsx` ne re-render pas inutilement (pas de state dans les layouts)
- [ ] Les `loading.tsx` existent pour les routes avec data fetching
- [ ] Les `error.tsx` existent pour la gestion d'erreurs par segment

#### Images & Assets
- [ ] Utilisation de `next/image` au lieu de `<img>` natif
- [ ] Les images ont `width`/`height` ou `fill` définis
- [ ] Les imports statiques sont privilégiés pour les assets locaux

#### Data Fetching
- [ ] Pas de `useEffect` + `fetch` pour des données qui pourraient être fetchées côté serveur
- [ ] Les API routes (`app/api/`) valident les inputs
- [ ] Pas de waterfall de requêtes (fetch en parallèle quand possible)

#### Performance Next.js
- [ ] `dynamic()` import pour les composants lourds non-critiques
- [ ] Pas de gros packages importés côté client sans nécessité
- [ ] Les fonts utilisent `next/font` (pas de `<link>` Google Fonts externe)

---

### 4. React / Vercel Best Practices

Pour chaque composant, vérifier :

#### Hooks
- [ ] Pas de hooks conditionnels (dans des `if`, `for`, `try/catch`)
- [ ] `useMemo` / `useCallback` utilisés pour les calculs coûteux ou les props de référence instable passées aux children
- [ ] Pas de `useMemo` / `useCallback` inutiles (sur des valeurs primitives ou des composants qui re-render de toute façon)
- [ ] Les dépendances des hooks (`useEffect`, `useMemo`, `useCallback`) sont complètes et correctes
- [ ] Pas de `useEffect` pour de la logique dérivée (préférer le calcul direct dans le render)

#### State Management
- [ ] Le state est au niveau le plus bas possible (colocation)
- [ ] Pas de prop drilling excessif (>3 niveaux → context ou composition)
- [ ] Les états liés sont regroupés dans un seul `useState` (objet) ou `useReducer`
- [ ] Pas de duplication de state (state dérivable d'un autre state ou de props)

#### Rendering
- [ ] Chaque élément dans une liste a une `key` **unique et stable** (pas d'index comme key sauf listes statiques)
- [ ] Pas de création d'objets/tableaux inline dans le JSX (cause des re-renders)
- [ ] Les composants enfants sont extraits quand le JSX dépasse ~80 lignes
- [ ] Pas de logique métier dans le JSX (extraire dans des fonctions ou hooks)

#### TypeScript
- [ ] Types explicites sur les props des composants (pas de `any`)
- [ ] Interfaces/types exportés quand réutilisés
- [ ] Pas d'assertions `as` non justifiées
- [ ] Utilisation de `satisfies` quand pertinent

---

### 5. Code Quality — Dead Code & Redondances

#### Dead Code
- [ ] Pas d'imports inutilisés (fichiers importés mais jamais référencés)
- [ ] Pas de variables/fonctions déclarées mais jamais utilisées
- [ ] Pas de composants exportés mais jamais importés ailleurs
- [ ] Pas de fichiers orphelins (ni importés ni route)
- [ ] Pas de code commenté laissé en place (supprimer ou créer une issue)
- [ ] Pas de `console.log` / `console.debug` restants

Grep patterns :
```
# console.log restants
console\.(log|debug|info)\(

# TODO/FIXME/HACK oubliés
(TODO|FIXME|HACK|XXX):?

# Imports potentiellement inutilisés — vérifier manuellement
^import .* from
```

#### Redondances
- [ ] Pas de composants dupliqués (même logique dans 2+ fichiers)
- [ ] Pas de styles inline répétés (extraire en classes Tailwind ou utilitaires)
- [ ] Pas de fonctions utilitaires dupliquées (centraliser dans `lib/`)
- [ ] Les constantes magiques sont extraites (pas de strings/numbers hardcodés répétés)

#### DRY & Simplification
- [ ] Pas de wrappers inutiles (composants qui ne font que passer des props)
- [ ] Pas de conditions imbriquées sur +3 niveaux (extraire en fonctions ou early return)
- [ ] Pas de chaînes ternaires (utiliser `if/else` ou `switch`)

---

### 6. Appel au skill a11y

Invoquer le skill `/a11y` avec le même scope pour l'audit d'accessibilité :

```
Skill: a11y
Args: <même scope que $ARGUMENTS>
```

Intégrer les résultats dans le rapport final.

---

### 7. Rapport final

Présenter le rapport complet :

```
🧹 Audit Clean terminé !

## Checks automatiques
- Build : ✅ | ❌
- Lint : ✅ | ❌
- IDE Diagnostics : ✅ | ⚠️ <N> warnings

## Next.js Best Practices
- Server/Client Components : ✅ | ⚠️ <détails>
- Routing & Metadata : ✅ | ⚠️ <détails>
- Images & Assets : ✅ | ⚠️ <détails>
- Data Fetching : ✅ | ⚠️ <détails>
- Performance : ✅ | ⚠️ <détails>

## React / Vercel Best Practices
- Hooks : ✅ | ⚠️ <détails>
- State Management : ✅ | ⚠️ <détails>
- Rendering : ✅ | ⚠️ <détails>
- TypeScript : ✅ | ⚠️ <détails>

## Code Quality
- Dead Code : ✅ | ⚠️ <N> éléments trouvés
- Redondances : ✅ | ⚠️ <détails>
- DRY : ✅ | ⚠️ <détails>

## Accessibilité (via /a11y)
- <résumé du rapport a11y>

## Problèmes trouvés
1. [Critique] <description> — <fichier:ligne> — <catégorie>
2. [Majeur] <description> — <fichier:ligne> — <catégorie>
3. [Mineur] <description> — <fichier:ligne> — <catégorie>

## Verdict
✅ Code clean et optimisé | ⚠️ <N> corrections nécessaires
```

Classer par sévérité :
- **Critique** : bug, faille de sécu, build cassé
- **Majeur** : anti-pattern, dead code significatif, violation de convention
- **Mineur** : optimisation possible, amélioration recommandée

### 8. Corrections si demandé

- Proposer les corrections groupées par catégorie
- Sur validation de l'utilisateur, corriger et re-run l'audit
- Boucler jusqu'à verdict ✅
