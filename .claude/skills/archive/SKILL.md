---
name: archive
description: Archive un plan validé en ADR + changelog pour documenter les décisions et l'historique du projet
argument-hint: "[description courte du plan validé]"
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Archive — Archivage des plans validés

Ce skill documente chaque plan validé sous deux formes :
- **ADR** (Architecture Decision Record) dans `docs/decisions/`
- **Entrée changelog** dans `docs/changelog.md`

---

## Étape 1 — Identifier le plan à archiver

Si `$ARGUMENTS` est fourni, utilise-le comme description du plan.

Sinon, analyse la conversation courante pour identifier le **dernier plan validé par l'utilisateur** (recherche les mots-clés : "oui", "go", "on part là-dessus", "validé", approbation d'un plan).

Extrais :
- **Titre court** du plan (ce qui a été décidé)
- **Contexte** (pourquoi cette décision était nécessaire)
- **Décision** (ce qui a été choisi, détails d'implémentation)
- **Alternatives envisagées** (si discutées dans la conversation)
- **Conséquences** (impact sur le projet)

---

## Étape 2 — Déterminer le numéro ADR

Scanne `docs/decisions/` pour trouver le dernier numéro ADR existant.

```bash
ls docs/decisions/ | grep -E '^[0-9]{4}-' | sort -r | head -1
```

Le nouvel ADR prend le numéro suivant (0001, 0002, etc.).

---

## Étape 3 — Créer l'ADR

Crée le fichier `docs/decisions/NNNN-<slug>.md` avec ce template exact :

```markdown
# ADR-NNNN : <Titre de la décision>

**Date :** YYYY-MM-DD
**Statut :** Accepté

## Contexte

<Pourquoi cette décision était nécessaire. Quel problème on résolvait.>

## Décision

<Ce qui a été choisi. Détails d'implémentation, structure, patterns utilisés.>

## Alternatives envisagées

<Ce qui a été discuté et rejeté, avec les raisons.>
<Si aucune alternative n'a été discutée, écrire : "Pas d'alternative discutée.">

## Conséquences

- **Positif :** <impacts positifs>
- **Négatif / Risques :** <impacts négatifs ou risques identifiés, ou "Aucun identifié.">
```

### Règles de rédaction
- Langue : **français**
- Ton : factuel, concis, technique
- Le slug du fichier est en kebab-case anglais (ex: `0003-use-zustand-for-state.md`)
- Ne jamais inventer d'informations non présentes dans la conversation

---

## Étape 4 — Mettre à jour le changelog

Ajoute une entrée **en haut** de `docs/changelog.md` (après le titre).

Si le fichier n'existe pas, crée-le avec le header :

```markdown
# Changelog du projet

Historique chronologique des décisions et implémentations du projet Nox Confidential Token Demo.

---
```

Format d'une entrée :

```markdown
### YYYY-MM-DD — <Titre court>

<Résumé en 1-3 phrases de ce qui a été fait et pourquoi.>

→ ADR : [ADR-NNNN](./decisions/NNNN-<slug>.md)
```

---

## Étape 5 — Mettre à jour l'index des ADRs

Mets à jour `docs/decisions/index.md`.

Si le fichier n'existe pas, crée-le avec le header :

```markdown
# Index des Architecture Decision Records

| # | Titre | Date | Statut |
|---|-------|------|--------|
```

Ajoute une ligne au tableau :

```markdown
| NNNN | [<Titre>](./NNNN-<slug>.md) | YYYY-MM-DD | Accepté |
```

---

## Étape 6 — Récapitulatif

Affiche :

```
📋 Plan archivé !
   ADR : docs/decisions/NNNN-<slug>.md
   Changelog : docs/changelog.md (entrée ajoutée)
   Index : docs/decisions/index.md (mis à jour)
```
