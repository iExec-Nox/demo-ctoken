---
name: branch
description: Crée une branche Git nommée selon les conventions à partir de la description de la tâche
argument-hint: [description de la tâche]
allowed-tools: Bash(git *)
---

# Skill : branch

Crée une branche Git propre à partir de la description de la tâche.

## Entrée

`$ARGUMENTS` contient la description de la tâche (ex: "ajouter la page faucet", "fix du bug de connexion wallet").

## Étapes

### 1. Vérifier l'état du repo

```bash
git status
```

- Si des changements non commités existent, **STOP** et prévenir l'utilisateur : _"Il y a des changements non commités. Commit ou stash avant de créer une branche."_

### 2. Déterminer le type de branche

Analyse `$ARGUMENTS` pour choisir le préfixe :

| Mot-clé détecté | Préfixe |
|------------------|---------|
| fix, bug, corrig | `fix/` |
| refactor, clean, réusin | `refactor/` |
| doc, readme, adr | `docs/` |
| chore, config, ci, setup | `chore/` |
| style, css, design, ui | `style/` |
| test | `test/` |
| **Tout le reste** | `feat/` |

### 3. Générer le slug

- Extraire les mots-clés de `$ARGUMENTS`
- Convertir en **kebab-case anglais**, max 4-5 mots
- Exemples :
  - "ajouter la page faucet" → `feat/add-faucet-page`
  - "fix du bug de connexion wallet" → `fix/wallet-connection-bug`
  - "refactor des hooks web3" → `refactor/web3-hooks`

### 4. Créer et basculer sur la branche

```bash
git checkout -b <prefix>/<slug>
```

### 5. Récapitulatif

Afficher :

```
🌿 Branche créée : <prefix>/<slug>
   Base : <branche-parente> (<hash-court>)
```
