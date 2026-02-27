---
name: ship
description: Orchestre le workflow complet d'une tâche — worktree → plan → build → review → commit & PR
argument-hint: [description de la tâche]
allowed-tools: Skill, Read, Write, Edit, Glob, Grep, Bash(git *), Bash(gh *), Bash(npm *), Bash(npx *), Bash(curl *), Task, EnterPlanMode, ExitPlanMode, EnterWorktree, AskUserQuestion, mcp__figma-desktop__get_design_context, mcp__figma-desktop__get_screenshot, mcp__ide__getDiagnostics
---

# Skill : task

Orchestre le workflow complet d'une tâche, du worktree isolé à la PR.

## Entrée

`$ARGUMENTS` contient la description de la tâche (ex: "implémenter la page faucet", "ajouter le dark mode").

## Workflow

Le workflow se déroule en **6 phases séquentielles**. Chaque phase est un checkpoint — ne jamais sauter une phase sans validation.

---

### Phase 1 : Worktree 🌿

Créer un worktree isolé via l'outil `EnterWorktree`.

**Nommage du worktree :** dériver un slug depuis `$ARGUMENTS` (kebab-case anglais, max 4-5 mots).
Exemples :
- "implémenter la page faucet" → `add-faucet-page`
- "fix du bug de connexion wallet" → `fix-wallet-connection`

Appeler `EnterWorktree` avec ce nom.

**Lien symbolique .env :** Après création du worktree, créer un symlink du `.env.local` de la racine du projet vers le worktree :
```bash
ln -s <racine-projet>/.env.local <worktree>/.env.local
```
Cela garantit que les variables d'environnement sont disponibles dans le worktree.

Résultat attendu : on travaille dans un worktree isolé avec sa propre branche et un `.env.local` fonctionnel.

---

### Phase 2 : Plan 📐

Invoquer le skill `/plan` avec `$ARGUMENTS`.

Résultat attendu : un plan structuré validé par l'utilisateur.

**Checkpoint :** Attendre la validation explicite de l'utilisateur avant de continuer.

---

### Phase 3 : Archivage du plan 📋

Invoquer le skill `/archive` avec un résumé court du plan validé.

Résultat attendu : ADR créé + changelog mis à jour.

---

### Phase 4 : Implémentation 🔨

Invoquer le skill `/build`.

Résultat attendu : code implémenté, build passant.

---

### Phase 5 : Review 📋

Invoquer le skill `/review`.

Résultat attendu : tous les checks passent, conventions respectées.

**Checkpoint :** Présenter le rapport de review à l'utilisateur. Attendre validation avant de commit.

---

### Phase 6 : Commit & PR 🚀

Invoquer le skill `/commit`.

Résultat attendu : commits atomiques, push, PR créée.

---

## Récapitulatif final

À la fin du workflow complet, afficher :

```
🎯 Tâche terminée !

   🌿 Worktree : <nom-du-worktree> (branche: <nom-de-la-branche>)
   📐 Plan : validé (<n> étapes)
   📋 ADR : docs/decisions/<fichier>.md
   🔨 Build : <n> fichiers créés, <n> modifiés
   📋 Review : ✅ tous les checks passent
   🚀 PR : <url-de-la-pr>
```

## Règles

- **Ne jamais sauter une phase.** Si l'utilisateur demande d'aller plus vite, on peut simplifier une phase mais pas la supprimer.
- **Toujours attendre la validation** aux checkpoints (Phase 2 et Phase 5).
- **Si une phase échoue**, corriger avant de passer à la suivante.
- **Répondre en français** tout au long du workflow.
