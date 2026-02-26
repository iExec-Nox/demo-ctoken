---
name: plan
description: Explore le codebase, propose un plan structuré et le valide avec l'utilisateur
argument-hint: [description de la tâche ou feature à planifier]
allowed-tools: Read, Write, Edit, Glob, Grep, Task, EnterPlanMode, ExitPlanMode, AskUserQuestion
---

# Skill : plan

Explore le codebase et propose un plan d'implémentation structuré pour validation.

## Entrée

`$ARGUMENTS` contient la description de la tâche ou feature à planifier.

## Étapes

### 1. Comprendre le contexte

- Lire `CLAUDE.md` et `components/CLAUDE.md` pour les conventions du projet
- Explorer les fichiers existants pertinents à la tâche avec `Glob` et `Grep`
- Identifier les composants, pages, hooks et libs déjà en place qui seront impactés
- Si la tâche concerne un design Figma, utiliser `get_design_context` et `get_screenshot`

### 2. Entrer en mode plan

Utiliser `EnterPlanMode` pour structurer la réflexion.

### 3. Rédiger le plan

Le plan doit suivre ce format :

```markdown
## Objectif
<1 phrase décrivant ce qu'on veut accomplir>

## Contexte
<Ce qui existe déjà, ce qui va être impacté>

## Étapes d'implémentation
1. <Étape 1> — <fichier(s) concerné(s)>
2. <Étape 2> — <fichier(s) concerné(s)>
...

## Fichiers à créer
- `path/to/file.tsx` — <description>

## Fichiers à modifier
- `path/to/file.tsx` — <description du changement>

## Points d'attention
- <Convention à respecter, edge case, dépendance>
```

### 4. Valider avec l'utilisateur

- Présenter le plan de manière concise
- Utiliser `ExitPlanMode` pour soumettre le plan à validation
- Attendre l'approbation explicite ("oui", "go", "on part là-dessus", "validé")

### 5. Récapitulatif

Après validation, afficher :

```
✅ Plan validé !
   Objectif : <objectif>
   Étapes : <nombre> étapes d'implémentation
   Fichiers impactés : <nombre>
```

> **Note :** Après validation, le skill `/planifieur` peut être invoqué pour archiver le plan en ADR.
