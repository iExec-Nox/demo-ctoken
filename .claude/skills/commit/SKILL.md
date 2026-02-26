---
name: commit
description: Commit, push and create PR following atomic commits and conventional commits standards
argument-hint: "[optional commit hint]"
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(gh pr *)
---

# Commit — Commit atomique + Push + PR

## Étape 1 — Analyse des changements

Lance ces commandes en parallèle :

- `git status` (jamais `-uall`)
- `git diff` (changements non stagés)
- `git diff --staged` (changements déjà stagés)
- `git log --oneline -5` (style des commits récents)

Analyse les fichiers modifiés et regroupe-les par **responsabilité logique**. Chaque groupe deviendra un commit atomique.

---

## Étape 2 — Commits atomiques

### Règles absolues

- **Un commit = un seul changement logique.** Jamais de commit fourre-tout.
- Si les changements touchent plusieurs responsabilités, découpe en **plusieurs commits séparés**.
- Ordre logique : les dépendances d'abord (lib → hooks → composants → pages).
- Stage **sélectif par fichier** : `git add <file1> <file2>`. JAMAIS `git add .` ni `git add -A`.
- Ne commit **jamais** de fichiers sensibles (`.env`, credentials, secrets).

### Exemples de découpage

| Changements | Commits |
|---|---|
| Nouveau composant + page qui l'utilise | 1. `feat(components): add TransferForm component` 2. `feat(transfer): wire TransferForm into transfer page` |
| Bugfix + refactor découvert en chemin | 1. `fix(dashboard): correct cToken balance calculation` 2. `refactor(dashboard): extract BalanceCard component` |
| Nouvelle lib + hook + composant | 1. `feat(sdk): add confidentialTransfer wrapper` 2. `feat(hooks): add useTransfer hook` 3. `feat(transfer): implement transfer flow UI` |

---

## Étape 3 — Conventional Commits

### Format strict

```
<type>(<scope>): <description>

[body optionnel]
```

### Types autorisés

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Restructuration sans changement de comportement |
| `style` | Formatage, espaces, points-virgules (pas de changement de logique) |
| `docs` | Documentation uniquement |
| `test` | Ajout ou correction de tests |
| `chore` | Tâches de maintenance (deps, config, scripts) |
| `perf` | Amélioration de performance |
| `ci` | Changements CI/CD |
| `build` | Changements du système de build |

### Règles du message

- **Scope** = dossier ou feature concernée (`transfer`, `dashboard`, `sdk`, `components`, `hooks`, etc.)
- **Description** : impératif, anglais, lowercase, < 72 caractères, pas de point final
- **Body** (optionnel) : bullet points si le changement mérite explication. Séparer du titre par une ligne vide.
- Toujours passer le message via HEREDOC :

```bash
git commit -m "$(cat <<'EOF'
feat(transfer): add recipient address validation

- Validate Ethereum address format with viem
- Show inline error for invalid addresses
- Disable submit button until address is valid
EOF
)"
```

Si `$ARGUMENTS` est fourni, utilise-le comme hint pour orienter les messages de commit — mais respecte toujours le format conventional commits et le découpage atomique.

---

## Étape 4 — Push

Après **tous** les commits :

```bash
git push -u origin HEAD
```

---

## Étape 5 — PR (si branche ≠ main)

Si la branche courante n'est **pas** `main`, crée une PR avec `gh pr create` :

### Titre

- Reprend le conventional commit principal ou résume l'ensemble si multi-commits
- Format conventional commit, < 70 caractères

### Body

```bash
gh pr create --title "<titre>" --body "$(cat <<'EOF'
## Summary
- <bullet points décrivant les changements clés>

## Changes
- <liste des commits inclus dans la PR>

## Test plan
- [ ] <checklist de vérification manuelle>
EOF
)"
```

Retourne l'URL de la PR à l'utilisateur.

---

## Étape 6 — Résumé

Affiche un récapitulatif clair :

```
✅ <nombre> commit(s) créé(s)
   - <hash court> <message>
   - <hash court> <message>
✅ Push sur <branche>
✅ PR créée : <url>  (si applicable)
```
