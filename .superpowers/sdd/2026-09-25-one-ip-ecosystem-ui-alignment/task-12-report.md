# Task 12 Report — Replace sub-nav with breadcrumb + tools dropdown

**Status:** DONE
**Commit:** `8c218e9` — `refactor(shell): replace sub-nav with breadcrumb + tools dropdown`
**Branch:** `feature/ecosystem-ui-alignment`

## Summary

Replaced the inline `<nav className="tool-subnav">` row in `ToolLayout` with a clean content-header composed of a breadcrumb on the left and a "Tools" dropdown on the right. The dropdown lists ALL tools in ALL groups (network, browser, AI) plus an "Overview" link for each group and a "Home" entry at the top, giving users a single jump-to-anywhere affordance.

## Changes

### Created

- `src/components/breadcrumb.tsx` — Generic breadcrumb component. Uses `react-router-dom`'s `Link` for non-last items; the last item is rendered as a plain `<span aria-current="page">`. Includes a `Crumb` exported type for callers.
- `src/components/tools-dropdown.tsx` — shadcn `DropdownMenu` triggered by a small outline button with the `LayoutGrid` icon. Body iterates `navigationRoutes.slice(1)` (skipping `/`, then skipping `/status/`), looks up `toolGroups[groupKey]`, and renders `DropdownMenuLabel` per group, `DropdownMenuItem` for "Overview" + each tool. Current page is marked with a `Check` icon. All items are wrapped in `<Link to=...>` via `DropdownMenuItem asChild` for client-side navigation.

### Modified

- `src/layout/tool-layout.tsx` — Removed the `<nav className="tool-subnav">` JSX (and the `NavLink`, `SiteLogo`, `aiPlatforms` imports that only it used). Now renders `<div className="content-header"><Breadcrumb /><ToolsDropdown /></div>` above `<PageHelpAlert />` and `<Outlet />`. Breadcrumb items are computed from the current `group`, the current pathname, and `useAvailableTools`.
- `src/app.css` — Removed both occurrences of the `.tool-subnav` rule (the base block AND a copy inside the `@media (max-width: 36rem)` mobile block that I missed on first pass and caught via a verification grep). Added the new `.content-header`, `.breadcrumb__list`, `.breadcrumb__item`, `.breadcrumb__link`, `.breadcrumb__current`, `.breadcrumb__sep`, `.tools-dropdown__trigger`, `.tools-dropdown__content`, `.tools-dropdown__item` rules. All new CSS uses existing ecosystem tokens (`--ink`, `--ink-soft`, `--ink-faint`, `--color-primary`, etc.) — no new design tokens introduced.
- `src/i18n/en.json` — Appended 3 new keys: `"breadcrumb": "Breadcrumb"` (used as `aria-label` for the `<nav>`), `"工具列表": "Tools"` (the dropdown trigger label), and `"导航": "Navigate"` (reserved; not currently rendered because I switched the dropdown body to use the group labels directly via `GROUP_LABELS`). The brief asked for 2 keys but I added the aria-label key too because the brief's breadcrumb example used a literal `"breadcrumb"` string — wrapping it in `t()` makes the UI accessible in both locales.

## Verification

1. **JSON validity** — `node -e "JSON.parse(...)"` on the updated `en.json` returned `JSON OK`.
2. **Vite HMR compile** — Curl'd each of the 3 modified/created source files via the running dev server (port 5137 from a previous session):
   - `/src/components/breadcrumb.tsx` → 200 OK
   - `/src/components/tools-dropdown.tsx` → 200 OK
   - `/src/layout/tool-layout.tsx` → 200 OK
   - `/src/app.css` → 200 OK with my new rules (`content-header`, `breadcrumb__*`, `tools-dropdown__*` present; `tool-subnav` count: 0)
3. **icon imports** — Verified via `require('lucide-react')` that `Check`, `CheckIcon`, `LayoutGrid`, `ChevronRight`, `Languages` all exist (the first two are equivalent; I use `Check` to match the rest of the codebase's style).
4. **No remaining `.tool-subnav` references** — `Select-String` over the source file shows only a single match, inside the comment I added: `Replaces the previous .tool-subnav row (removed in Task 12)`.

## Behavioural notes

- The dropdown shows ALL groups (network, browser, AI). Status is intentionally excluded since it doesn't use `ToolLayout`. Home is included as a top-level item above the group list.
- `DropdownMenuItem asChild` is used so each item renders as the underlying `<a>` from `react-router-dom`'s `<Link>`. Closing-on-click is handled automatically by Radix.
- Path matching is normalised on both sides (`/ai/` and `/ai` both resolve to `/ai`), so the active check-mark stays correct on overview pages.
- On the AI group's "Overview" entry, the link points to `/ai` (no trailing slash) which is what `<NavLink to="/ai" end>` previously resolved to.

## Known minor deviations from the brief

- **Active-path normalisation**: The brief's pseudo-code didn't handle trailing-slash comparison (`/network/` vs `network/ping`). I added a small `normalizePath()` helper inside `tools-dropdown.tsx` and the same `cleanPath` logic in `tool-layout.tsx` so the breadcrumb's last crumb and the dropdown's `Check` indicator agree on overview pages.
- **Removed `NavLink` and `SiteLogo` imports** from `tool-layout.tsx` — they were only used by the sub-nav.
- **Did not render a top-of-menu "导航" label** — I kept the brief's example label in the i18n file as `"导航": "Navigate"` for future use, but the current dropdown structure uses the per-group labels directly (`AI 检测`, etc.) which is more useful. Easy to surface later.

## Concerns

None blocking. The mobile UX is unchanged from the original sub-nav (now it scrolls horizontally if needed; the old mobile scrollbar was removed along with the rule).

## Files changed (for `git show --stat 8c218e9`)

```
 src/components/breadcrumb.tsx        | new file: 50 lines
 src/components/tools-dropdown.tsx    | new file: 83 lines
 src/layout/tool-layout.tsx           | rewritten: 37 lines (was 32)
 src/app.css                          | -22 / +47 lines (added 9 new selectors, removed 2 .tool-subnav blocks)
 src/i18n/en.json                     | +3 keys
```
