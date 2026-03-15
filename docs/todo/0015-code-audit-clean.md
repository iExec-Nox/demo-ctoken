# ADR-0015 : Audit Code — Clean & Accessibilité

**Date :** 2026-03-13
**Statut :** À traiter

## Contexte

Audit complet du codebase réalisé le 13 mars 2026 via le skill `/clean`. Build et lint passent sans erreur. L'audit couvre : Next.js best practices, React/hooks, code quality, dead code, et accessibilité WCAG 2.1 AA.

## Résumé

- **Build** : ✅ — **Lint** : ✅ — **TypeScript `any`** : ✅ aucun — **`console.log`** : ✅ aucun
- **16 findings** : 2 critiques, 9 majeurs, 5 mineurs

---

## Findings Critiques

### C1. `fromBlock: 0n` scanne toute la chaîne

**Fichier :** `hooks/use-activity-history.ts:94`

Les 4 queries `getContractEvents` utilisent `fromBlock: 0n`, ce qui scanne l'intégralité de l'historique Arbitrum Sepolia à chaque chargement + toutes les 30s. Extrêmement lent et rate-limited par les RPC.

**Fix :** Calculer un `fromBlock` raisonnable (ex : bloc courant - 100 000, soit ~3 jours sur Arbitrum).

### C2. Clipboard error silencieux

**Fichier :** `hooks/use-copy-to-clipboard.ts:13`

`.catch(() => {})` avale toute erreur clipboard. En navigation privée ou si l'API est bloquée, l'UI ne donne aucun feedback.

**Fix :** Au minimum logger l'erreur, idéalement exposer un état `error`.

---

## Findings Majeurs

### M1. Pas d'état d'erreur exposé sur les prix

**Fichier :** `hooks/use-token-prices.ts:24-28`

Si `/api/prices` retourne une erreur, le hook renvoie silencieusement `{}` — l'UI affiche "$0" pour tous les tokens sans indication d'erreur.

**Fix :** Ajouter `const [error, setError] = useState<string | null>(null)` et l'exposer dans le retour.

### M2. `decryptingSymbol` dans les deps du callback

**Fichier :** `hooks/use-decrypt-balance.ts:34`

`decryptingSymbol` est dans le dependency array de `useCallback` ET vérifié à l'intérieur. La fonction change de référence à chaque decrypt, causant des re-renders inutiles des parents.

**Fix :** Retirer `decryptingSymbol` des deps, utiliser un `useRef` à la place.

### M3. Boucle séquentielle sans récupération partielle

**Fichier :** `hooks/use-add-viewer.ts:114-129`

Si le 2e `writeContractAsync` échoue après que le 1er ait réussi, l'utilisateur voit seulement l'erreur mais le 1er grant est déjà fait. Pas de feedback sur le progrès partiel.

**Fix :** Collecter les erreurs par token et afficher un message de progrès partiel.

### M4. Gas estimé une seule fois pour N itérations

**Fichier :** `hooks/use-add-viewer.ts:73`

`estimateGasOverrides` est appelé une fois avant la boucle mais réutilisé pour toutes les itérations (avec 2s de cooldown entre chaque). Les fees peuvent changer.

**Fix :** Re-estimer le gas à chaque itération de la boucle.

### M5. Liens placeholder `href="#"`

**Fichiers :** `components/layout/mobile-menu.tsx:103`, `components/layout/dashboard-header.tsx:68`

"Contact us" pointe vers `#` — lien non fonctionnel en prod.

**Fix :** Remplacer par le vrai lien ou utiliser un `<button>` si l'action n'existe pas encore.

### M6. Tailles de titre modales inconsistantes

- `wrap-modal.tsx:185` → `md:text-[34px]`
- `transfer-modal.tsx:138` → `md:text-[36px]`
- `selective-disclosure-modal.tsx:217` → `md:text-[36px]`

**Fix :** Standardiser sur une seule valeur.

### M7. `aria-disabled` au lieu de `disabled`

**Fichier :** `components/modals/selective-disclosure-modal.tsx:465, 486`

`aria-disabled="true"` n'empêche pas l'interaction clavier — le bouton reste focusable et activable.

**Fix :** Utiliser l'attribut `disabled` natif.

### M8. Dropdowns custom sans support clavier complet

**Fichiers :** `components/modals/wrap-modal.tsx`, `components/modals/transfer-modal.tsx`

Les token selectors utilisent un `<div role="listbox">` custom sans gestion Arrow Up/Down, sans `role="option"` sur les items.

**Fix :** Migrer vers le `Select` de shadcn/ui ou implémenter le support clavier complet.

### M9. `ErrorMessage` sans annonce screen reader

**Fichier :** `components/shared/error-message.tsx:8`

Les erreurs dynamiques ne sont pas annoncées aux technologies d'assistance.

**Fix :** Ajouter `role="alert"` au container `<div>`.

---

## Findings Mineurs

### m1. Timestamp fetching sans batching

**Fichier :** `hooks/use-activity-history.ts:46`

`fetchBlockTimestamps` lance N appels RPC en parallèle sans limite. Risque de rate-limiting.

**Fix :** Batching par tranches de 5.

### m2. `router` dans les deps de useEffect

**Fichier :** `hooks/use-wallet-redirect.ts`

`router` est un nouvel objet à chaque render, causant l'effet à re-exécuter inutilement.

**Fix :** Retirer `router` des deps.

### m3. TODO comments restants

- `hooks/use-unwrap.ts:80` — mock proof à remplacer
- `lib/contracts.ts:9` — collision d'adresses à résoudre

### m4. Radio/checkbox sans `focus-visible`

**Fichier :** `components/modals/selective-disclosure-modal.tsx:284-315, 362-401`

Pas de ring de focus visible sur les boutons radio/checkbox custom.

**Fix :** Ajouter `focus-visible:ring-2 focus-visible:ring-primary/50`.

### m5. Inputs sans `<label>` HTML

**Fichiers :** `components/modals/transfer-modal.tsx:292`, `components/modals/wrap-modal.tsx:333`

Les inputs utilisent `aria-label` mais pas de `<label htmlFor>` native.

**Fix :** Ajouter des labels visuellement cachés (`sr-only`) ou explicites.

---

## Ordre de traitement recommandé

| Priorité | Finding | Effort |
|----------|---------|--------|
| 1 | C1 — `fromBlock: 0n` | Moyen |
| 2 | C2 — Clipboard silent catch | Faible |
| 3 | M9 — `role="alert"` sur ErrorMessage | Faible |
| 4 | M7 — `aria-disabled` → `disabled` | Faible |
| 5 | M2 — `decryptingSymbol` deps | Faible |
| 6 | M1 — Error state prix | Faible |
| 7 | M5 — `href="#"` placeholder | Faible |
| 8 | M6 — Tailles titres modales | Faible |
| 9 | M3 — Partial progress addViewer | Moyen |
| 10 | M4 — Re-estimate gas dans la boucle | Faible |
| 11 | M8 — Dropdown clavier | Élevé |
| 12 | m1-m5 — Mineurs | Faible |
