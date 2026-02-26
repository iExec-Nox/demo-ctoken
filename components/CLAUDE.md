# CLAUDE.md — Components

## Conventions

- **File naming**: kebab-case for all component files (e.g. `hero-section.tsx`, `feature-card.tsx`). No camelCase or snake_case.
- **Named exports** only (no default exports): `export function MyComponent() {}`
- **Flat structure**: all components live directly in `/components`, no nesting
- **Single responsibility**: each component does one thing. Extract sub-components when a section contains repeated patterns (e.g. `FeatureCard` extracted from `FeaturesSection`)
- **Props interface**: define a dedicated `interface` for components with 2+ props
- **No inline data**: extract data arrays as `const` at module level (e.g. `FEATURES` array in `features-section.tsx`)

---

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#1d1d24` | Global page background (hardcoded on `html`/`body`) |
| Primary | `#748eff` | Buttons, icon backgrounds, accents |
| Primary hover | `#6378e6` | Button hover state |
| Text white | `text-white` | Titles, button labels |
| Text slate-100 | `#f1f5f9` | Header logo text |
| Text slate-400 | `#94a3b8` | Descriptions, subtitles |
| Text slate-500 | `#64748b` | Secondary/nav text (footer links, topbar) |
| Text slate-600 | `#475569` | Tertiary text (copyright) |

### Fonts (CSS variables from `next/font/google`)

| Variable | Font | Weights | Usage |
|----------|------|---------|-------|
| `--font-anybody` | Anybody | 700 | Large headings (hero 72px, section titles 32px) |
| `--font-mulish` | Mulish | 400, 500, 700 | UI text (topbar, subtitles, buttons, nav links) |
| `--font-inter` | Inter | 400, 500, 700 | Card content (titles, descriptions, footer) |

Usage pattern: `font-[family-name:var(--font-mulish)]`

Material Icons loaded via `<link>` in `<head>` for icon glyphs (e.g. `account_balance_wallet`).

### Component Patterns

**Card (glass style):**
```
rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-10 py-8
```

**Primary button:**
```
rounded-xl bg-[#748eff] shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] hover:bg-[#6378e6]
```

**Ghost button:**
```
rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08]
```

**Icon container (large — features):**
```
size-12 rounded-xl bg-[#748eff]
```

**Icon container (small — header/footer logo):**
```
size-8 rounded-xl bg-[#748eff] (header) / size-7 (footer)
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

## Current Inventory

| Component | File | Description |
|-----------|------|-------------|
| `Topbar` | `topbar.tsx` | Testnet indicator + "Get Test Tokens" link → `/faucet` |
| `Header` | `header.tsx` | Logo + "Connect Wallet" button (not connected state) |
| `HeroSection` | `hero-section.tsx` | Landing title, subtitle, 2 CTAs (Try It Now / Talk to us) |
| `FeatureCard` | `feature-card.tsx` | Reusable card: icon + title + description |
| `FeaturesSection` | `features-section.tsx` | 3 feature cards driven by `FEATURES` data array |
| `Footer` | `footer.tsx` | Logo + nav links (Documentation, Github, Terms) + copyright |

---

## Shared Components (to implement)

### `<TxStatus />`

Displays transaction lifecycle: `idle | pending | success | error` with spinner and colored badges.

### `<ArbiscanLink />`

```tsx
<ArbiscanLink txHash={hash} />
// Renders: "View on Arbiscan ↗" opening in new tab
// Base URL: https://sepolia.arbiscan.io/tx/{hash}
```

Must be present on **every** transaction confirmation screen.

### `<DeveloperModeProvider />`

Wraps the app. When Developer Mode is active, injects a floating log panel and annotates SDK calls.

---

## Assets (`/public`)

| File | Description |
|------|-------------|
| `nox-icon.png` | Logo icon (1024x1024 PNG) — used in Header and Footer |
| `feature-icon.svg` | Lightning/bolt SVG — used in FeatureCard |
