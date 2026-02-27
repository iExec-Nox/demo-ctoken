# /shadcn — Add or customize a shadcn/ui component

## Description
Guide l'ajout de nouveaux composants shadcn/ui dans le projet Nox, en respectant le design system et les conventions existantes.

## Trigger
L'utilisateur demande d'ajouter un composant UI, ou `/shadcn <component-name>`.

## Steps

### 1. Vérifier si le composant existe déjà
```bash
ls components/ui/
```
Si le fichier `components/ui/<component>.tsx` existe déjà, informer l'utilisateur et proposer une customisation plutôt qu'une réinstallation.

### 2. Installer le composant
```bash
npx shadcn@latest add <component-name> --yes
```
Vérifier que le fichier a bien été créé dans `components/ui/`.

### 3. Customiser pour le design system Nox

Appliquer les tokens sémantiques du projet. Ne JAMAIS utiliser de couleurs hardcodées.

**Tokens obligatoires :**
| Élément | Token Tailwind |
|---------|---------------|
| Background card/panel | `bg-surface` |
| Bordure | `border-surface-border` |
| Texte principal | `text-text-heading` |
| Texte secondaire | `text-text-body` |
| Texte tertiaire | `text-text-muted` |
| Bouton primaire | `bg-primary hover:bg-primary-hover` |
| Fond page | `bg-background` |

**Fonts :**
- Titres grands → `font-anybody`
- UI (boutons, nav, labels) → `font-mulish`
- Contenu cards → `font-inter`

### 4. Mettre à jour l'inventaire
Ajouter le nouveau composant dans le tableau "Current Inventory" de `components/CLAUDE.md` sous la section UI :

```markdown
| `<ComponentName>` | `ui/<component>.tsx` | Description courte |
```

### 5. Vérifier le build
```bash
npm run build
```

## Composants déjà installés
- `button` — `components/ui/button.tsx`
- `card` — `components/ui/card.tsx`
- `dropdown-menu` — `components/ui/dropdown-menu.tsx`
- `skeleton` — `components/ui/skeleton.tsx`
- `badge` — `components/ui/badge.tsx`
- `separator` — `components/ui/separator.tsx`
- `switch` — `components/ui/switch.tsx` (customisé avec props `thumbClassName`, `thumbChildren`, `size`)

## Règles
- Toujours utiliser `npx shadcn@latest add` pour l'installation (jamais copier manuellement)
- Les composants vivent dans `components/ui/` (convention shadcn)
- Customiser via `className` prop et tokens CSS, pas en modifiant le fichier source shadcn
- Exception : si le composant nécessite des props custom (comme `Switch`), modifier le fichier source
- Tester le rendu en light ET dark mode après ajout
