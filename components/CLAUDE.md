# CLAUDE.md — Components

## Conventions

- **File naming**: kebab-case for all component files (e.g. `hero-section.tsx`, `feature-card.tsx`). No camelCase or snake_case.
- **Named exports** only (no default exports): `export function MyComponent() {}`
- **Folder structure**: components are organized by theme in subfolders: `layout/`, `landing/`, `dashboard/`, `explorer/`, `modals/`, `shared/`. `ui/` is reserved for shadcn primitives. `providers.tsx` stays at root.
- **Single responsibility**: each component does one thing. Extract sub-components when a section contains repeated patterns (e.g. `FeatureCard` extracted from `FeaturesSection`)
- **Props interface**: define a dedicated `interface` for components with 2+ props
- **No inline data**: extract data arrays as `const` at module level (e.g. `FEATURES` array in `features-section.tsx`)
- **Light/Dark mode obligatoire** : tout composant créé ou modifié **doit** être compatible light et dark mode. Utiliser exclusivement les tokens sémantiques du design system (voir section Color Tokens ci-dessous). Un composant avec des couleurs hardcodées (`text-white`, `text-slate-*`, `bg-[#...]`) sera considéré comme non conforme et devra être corrigé avant merge.

---

## Design System

### Theme (Light / Dark)

The app supports light and dark themes via `next-themes` (class strategy with `.dark` on `<html>`).

**How it works:**
- CSS variables are defined in `globals.css`: `:root` for light, `.dark` for dark
- Variables are registered in `@theme inline` for Tailwind v4 usage
- `ThemeProvider` from `next-themes` wraps the app in `providers.tsx` (attribute: `class`, default: `dark`, system: enabled)
- `ThemeToggle` component in `header.tsx` provides sun/moon toggle

**Règle absolue :** Ne jamais utiliser de couleurs hardcodées (ex: `bg-[#1d1d24]`, `text-white`, `text-slate-400`). Toujours utiliser les tokens sémantiques Tailwind : `bg-background`, `text-text-heading`, `text-text-body`, etc. Avant chaque commit, vérifier visuellement le rendu en light ET dark mode.

### Color Tokens

| Tailwind token | Light | Dark | Usage |
|----------------|-------|------|-------|
| `bg-background` | `#dde2ee` | `#0f1119` | Page background |
| `text-foreground` | `#111827` | `#ededed` | Default body text |
| `bg-surface` | `#edf0f8` | `rgba(255,255,255,0.03)` | Card / panel backgrounds |
| `border-surface-border` | `#c0c6d8` | `rgba(255,255,255,0.08)` | Card borders |
| `text-text-heading` | `#111827` | `#ffffff` | H1, H2, H3, titles |
| `text-text-body` | `#6b7280` | `#94a3b8` | Descriptions, subtitles |
| `text-text-muted` | `#9ca3af` | `#64748b` | Tertiary text (topbar, captions) |
| `bg-primary` | `#748eff` | `#748eff` | Primary buttons, accents |
| `bg-primary-hover` | `#6378e6` | `#6378e6` | Button hover state |
| `bg-primary-alpha-18` | `rgba(116,142,255,0.18)` | `rgba(116,142,255,0.18)` | Wallet button bg |
| `border-primary-alpha-border` | `rgba(71,37,244,0.2)` | `rgba(71,37,244,0.2)` | Wallet button border |
| `bg-ghost-btn-bg` | `#6b6b78` | `rgba(255,255,255,0.03)` | Ghost/secondary button bg |
| `border-ghost-btn-border` | `transparent` | `rgba(255,255,255,0.08)` | Ghost button border |
| `text-ghost-btn-text` | `#ffffff` | `#ffffff` | Ghost button text |
| `bg-dropdown-bg` | `#ffffff` | `#2b2b2f` | Dropdown menu bg |
| `text-dropdown-text` | `#111827` | `#ffffff` | Dropdown menu text |
| `text-dropdown-link` | `#748eff` | `#748eff` | Dropdown accent text |
| `border-topbar-border` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.05)` | Topbar bottom border |
| `text-logo-text` | `#111827` | `#f1f5f9` | Logo text color |
| `text-footer-text` | `#64748b` | `#64748b` | Footer nav links |
| `text-footer-muted` | `#9ca3af` | `#475569` | Footer copyright text |
| `bg-card-icon-bg` | `#748eff` | `#748eff` | Feature card icon bg |
| `bg-tx-success-bg` | `rgba(34,197,94,0.15)` | `rgba(34,197,94,0.2)` | TxStatus success background |
| `text-tx-success-text` | `#16a34a` | `#4ade80` | TxStatus success text |
| `bg-tx-error-bg` | `rgba(239,68,68,0.15)` | `rgba(239,68,68,0.2)` | TxStatus error background |
| `text-tx-error-text` | `#dc2626` | `#f87171` | TxStatus error text |
| `bg-tx-pending-bg` | `rgba(234,179,8,0.15)` | `rgba(234,179,8,0.2)` | TxStatus pending background |
| `text-tx-pending-text` | `#ca8a04` | `#facc15` | TxStatus pending text |

### Fonts (CSS variables from `next/font/google`)

| Variable | Font | Weights | Usage |
|----------|------|---------|-------|
| `--font-anybody` | Anybody | 700 | Large headings (hero 72px, section titles 32px) |
| `--font-mulish` | Mulish | 400, 500, 700 | UI text (topbar, subtitles, buttons, nav links) |
| `--font-inter` | Inter | 400, 500, 700 | Card content (titles, descriptions, footer) |

Usage pattern (Tailwind v4 canonical syntax): `font-mulish`, `font-anybody`, `font-inter`

Material Icons loaded via `<link>` in `layout.tsx`. **Important:** Material Icons CSS sets `font-size: 24px` by default on `.material-icons`. Tailwind classes like `text-sm` will be overridden. Always use the `!` suffix to force the size (e.g. `text-[14px]!`, `text-lg!`).

### Component Patterns

**Card:**
```
rounded-2xl border border-surface-border bg-surface backdrop-blur-sm px-10 py-8
```

**Primary button:**
```
rounded-xl bg-primary shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] hover:bg-primary-hover
```

**Ghost button:**
```
rounded-xl border border-ghost-btn-border bg-ghost-btn-bg text-ghost-btn-text backdrop-blur-sm hover:opacity-80
```

**Icon container (large — features):**
```
size-12 rounded-xl bg-card-icon-bg
```

**Dropdown (popup menu):**
```
absolute right-0 top-full origin-top-right animate-[dropdown-in_150ms_ease-out] rounded-[7px] bg-dropdown-bg p-[10px]
```

### Spacing

| Zone | Padding |
|------|---------|
| Hero section | `px-40 py-16`, gap-10 |
| Features section | `px-40 py-16`, gap-10 between cards |
| Header | `px-20 py-6` |
| Footer | `p-10` |
| Topbar | `px-5 py-3` |

---

## Accessibility

- **Interactive elements** : utiliser `<button>` pour les actions (copier, logout, etc.) et `<a>` pour la navigation. Toujours ajouter `cursor-pointer` sur les boutons pour un feedback visuel cohérent.
- **Images** : attribut `alt` obligatoire sur tout `<img>` et `<Image>`. Utiliser `alt=""` uniquement pour les images purement décoratives.
- **Contraste** : respecter un ratio minimum de 4.5:1 entre le texte et le fond. Les tokens du design system sont calibrés pour les deux thèmes.
- **Focus visible** : ne jamais supprimer l'outline de focus natif (`outline-none` interdit sauf si un style de focus custom est fourni).
- **Sémantique HTML** : utiliser les balises appropriées (`<header>`, `<main>`, `<nav>`, `<footer>`, `<button>` pour les actions primaires, `<a>` pour les liens/menus).
- **ARIA labels** : ajouter `aria-label` sur les éléments interactifs dont le contenu visuel n'est pas suffisant (ex: bouton icône seul). Le `ThemeToggle` utilise un `aria-label` dynamique.
- **Keyboard navigation** : tous les éléments interactifs doivent être accessibles au clavier (Tab, Enter, Escape pour fermer les modales/dropdowns).
- **Dropdown pattern** : pour tout menu popup, implémenter : (1) fermeture au clic extérieur via `mousedown` listener avec exclusion du bouton trigger (`triggerRef`), (2) fermeture via touche Escape, (3) animation d'ouverture avec `origin-top-right`. Voir `WalletDropdown` dans `header.tsx` comme référence.

---

## Current Inventory

| Component | File | Description |
|-----------|------|-------------|
| `Topbar` | `topbar.tsx` | Testnet indicator + "Get Test Tokens" link |
| `Header` | `header.tsx` | Logo + ThemeToggle + Connect Wallet / Wallet dropdown |
| `ThemeToggle` | `theme-toggle.tsx` | Sun/moon button to switch light/dark theme |
| `Logo` | `logo.tsx` | Reusable logo (icon + text) with configurable `iconSize` and `font` |
| `HeroSection` | `hero-section.tsx` | Landing title, subtitle, 2 CTAs (Try It Now / Talk to us) |
| `FeatureCard` | `feature-card.tsx` | Reusable card: icon + title + description |
| `FeaturesSection` | `features-section.tsx` | 3 feature cards driven by `FEATURES` data array |
| `Footer` | `footer.tsx` | Logo + nav links (Documentation, Github, Terms) + copyright |
| `TxStatus` | `tx-status.tsx` | Transaction lifecycle badge: idle, pending (animated), success, error |
| `ArbiscanLink` | `arbiscan-link.tsx` | Link to `sepolia.arbiscan.io/tx/{hash}`, opens in new tab |

---

## Shared Components (to implement)

### `<DeveloperModeProvider />`

Wraps the app. When Developer Mode is active, injects a floating log panel and annotates SDK calls.

---

## Assets (`/public`)

| File | Description |
|------|-------------|
| `nox-icon.png` | Logo icon (1024x1024 PNG) — used in Header and Footer |
| `feature-icon.svg` | Lightning/bolt SVG — used in FeatureCard |
