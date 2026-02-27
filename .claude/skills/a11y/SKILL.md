---
name: a11y
description: Vérifie que le code respecte les standards d'accessibilité WCAG 2.1 AA
argument-hint: [optionnel: scope — fichier ou dossier à auditer]
allowed-tools: Read, Glob, Grep, Bash(npx *), Task, mcp__ide__getDiagnostics
---

# Skill : a11y

Audit d'accessibilité du code selon les critères **WCAG 2.1 niveau AA**.

## Scope

- Si `$ARGUMENTS` est fourni → limiter l'audit aux fichiers correspondants
- Sinon → auditer tous les fichiers `.tsx` dans `components/` et `app/`

## Étapes

### 1. Collecter les fichiers à auditer

```bash
# Glob pour récupérer les fichiers TSX du scope
components/**/*.tsx
app/**/*.tsx
```

### 2. Audit automatique — Sémantique HTML

Pour chaque fichier, vérifier :

#### Images & médias
- [ ] Toute `<img>` ou `<Image>` a un attribut `alt` **descriptif** (pas vide sauf si décoratif avec `alt=""` + `aria-hidden="true"`)
- [ ] Les SVG inline ont `role="img"` + `aria-label` ou `aria-hidden="true"` si décoratifs
- [ ] Les `<video>` et `<audio>` ont des contrôles accessibles

#### Formulaires
- [ ] Chaque `<input>`, `<select>`, `<textarea>` a un `<label>` associé (via `htmlFor` / `id`) ou `aria-label`
- [ ] Les messages d'erreur sont liés aux champs via `aria-describedby`
- [ ] Les groupes de champs utilisent `<fieldset>` + `<legend>`

#### Structure & sémantique
- [ ] Hiérarchie des headings cohérente (`h1` → `h2` → `h3`, pas de saut)
- [ ] Utilisation de landmarks sémantiques (`<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<section>`)
- [ ] Pas de `<div>` ou `<span>` cliquables sans `role="button"` + `tabIndex={0}` + `onKeyDown`
- [ ] Les listes utilisent `<ul>`/`<ol>` + `<li>` (pas de `<div>` simulant une liste)

#### Navigation clavier
- [ ] Tous les éléments interactifs sont focusables (pas de `tabIndex="-1"` sur des éléments actionnables)
- [ ] L'ordre du focus suit l'ordre visuel logique
- [ ] Les modales/dialogs gèrent le focus trap
- [ ] Les boutons de fermeture sont présents et focusables

#### ARIA
- [ ] `aria-label` ou `aria-labelledby` sur les éléments interactifs sans texte visible
- [ ] `aria-live` pour les zones de contenu dynamique (notifications, statuts de transaction)
- [ ] `aria-expanded` sur les éléments toggle (menus, accordéons)
- [ ] `role` utilisé correctement (pas de rôles inventés, pas de rôles redondants avec l'élément HTML natif)
- [ ] Pas de `aria-*` sur des éléments qui n'en ont pas besoin

#### Contraste & visuel
- [ ] Vérifier que les classes Tailwind de couleur assurent un ratio de contraste ≥ 4.5:1 (texte normal) / ≥ 3:1 (grand texte)
- [ ] Les états `:focus` ont un outline visible (pas de `outline-none` sans alternative `ring-*`)
- [ ] L'information n'est pas véhiculée uniquement par la couleur (ajouter icônes ou texte)

#### Mouvement & temps
- [ ] Les animations respectent `prefers-reduced-motion` (class `motion-reduce:` en Tailwind)
- [ ] Pas de contenu qui clignote plus de 3 fois par seconde

### 3. Grep patterns automatiques

Rechercher les anti-patterns courants :

```
# Images sans alt
<img(?![^>]*alt=)
<Image(?![^>]*alt=)

# Divs/spans cliquables sans accessibilité
onClick(?![^}]*(role|aria-|tabIndex|onKeyDown))

# outline-none sans ring
outline-none(?!.*ring)

# Liens vides
<a[^>]*>\s*<\/a>

# Boutons vides sans label
<button[^>]*>\s*<(svg|img)
```

### 4. Rapport d'accessibilité

Présenter le rapport :

```
♿ Audit d'accessibilité terminé !

## Résultats

### Images & médias
- ✅ | ⚠️ <détails>

### Formulaires
- ✅ | ⚠️ <détails>

### Structure & sémantique
- ✅ | ⚠️ <détails>

### Navigation clavier
- ✅ | ⚠️ <détails>

### ARIA
- ✅ | ⚠️ <détails>

### Contraste & visuel
- ✅ | ⚠️ <détails>

### Mouvement
- ✅ | ⚠️ <détails>

## Problèmes trouvés
1. [Critique] <description> — <fichier:ligne>
2. [Majeur] <description> — <fichier:ligne>
3. [Mineur] <description> — <fichier:ligne>

## Verdict
✅ Accessible (WCAG 2.1 AA) | ⚠️ Corrections nécessaires (<N> problèmes)
```

Classer les problèmes par sévérité :
- **Critique** : bloque l'accès (pas de alt, pas de label, pas de focus)
- **Majeur** : dégrade l'expérience (contraste faible, ARIA manquant)
- **Mineur** : amélioration recommandée (order de heading, motion-reduce)

### 5. Corrections si demandé

- Sur demande de l'utilisateur, corriger les problèmes trouvés
- Re-run l'audit après corrections pour valider
