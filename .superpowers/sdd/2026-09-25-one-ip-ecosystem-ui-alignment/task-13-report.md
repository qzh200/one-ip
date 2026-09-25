# Task 13 Report — Replace breadcrumb + tools dropdown with hover-dropdown submenu

**Branch:** `feature/ecosystem-ui-alignment`
**Status:** DONE_WITH_CONCERNS
**Commit:** `71531f8` — `refactor(shell): hover-dropdown submenu replaces breadcrumb + tools dropdown`

## Summary

Replaced the breadcrumb + tools-dropdown second row (Task 12) with a classic hover-dropdown
submenu (`二级菜单`) under the three group tabs in the top nav. The two simple tabs
(首页 / 服务状态) remain plain `<NavLink>`s.

## Files

| Action   | Path                                                                                                                                                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Created  | `src/components/nav-group-dropdown.tsx` (133 lines)                                                                                                                                                                                                                                                      |
| Modified | `src/layout/index.tsx` — manual nav: 2 × `<NavLink>` + 3 × `<NavGroupDropdown>`; `<AnimatedSegmentedTabs>` and `<ScrollArea>` removed from the top nav                                                                                                                                                   |
| Modified | `src/layout/tool-layout.tsx` — reduced to `<><PageHelpAlert /><Outlet /></>`; the `group` prop is retained for route compatibility but unused                                                                                                                                                            |
| Modified | `src/app.css` — Task 12 styles (`.content-header`, `.breadcrumb__*`, `.tools-dropdown__*`) deleted; new `.app-nav__items` / `.app-nav__link` / `.nav-group-dropdown__*` rules added; all `[role=tab]` and `.nav-tabs-scroll` selectors in the mobile/desktop media queries retargeted at the new classes |
| Deleted  | `src/components/breadcrumb.tsx`                                                                                                                                                                                                                                                                          |
| Deleted  | `src/components/tools-dropdown.tsx`                                                                                                                                                                                                                                                                      |

## Behavior

`NavGroupDropdown`:

- Opens on `mouseenter`; closes on `mouseleave` after a 150 ms grace timer so the cursor can travel into the menu without it collapsing.
- Toggles on click of the wrapping button (touch / accessibility path).
- Closes on `mousedown` outside the wrapper, on `Escape`, and after any menu item is selected.
- The label is a `<Link>` to the group overview (`/ai`, `/network`, `/browser`); clicking it navigates and closes the menu (event propagation is stopped so the wrapping button's click does not also fire).
- The menu lists 概述 first, then every tool from `toolGroups[group]`.
- `isActive` is computed by the parent (`isGroupActive(group, normalizedPath)`) and applied as a `.is-active` class on the wrapper, which styles the trigger in the active color on desktop and with the highlighted background on the mobile bottom pill.

## Validation

- `pnpm dev` started cleanly on `:5137`; HMR processed `src/app.css` and `src/components/nav-group-dropdown.tsx` without errors. Earlier curl checks against `/`, `/network` returned HTTP 200 with the SPA HTML.
- `npx tsc -b --noEmit` — clean (after switching `tools` to `readonly NavGroupTool[]` to match `toolGroups`).
- `npx oxlint` on the three changed files — clean.
- Visual confirmation in browser was not possible in this session (no MCP browser tool was available); the dev server timeout was a bash-side 120 s limit, not a code error.

## Concerns

- **Mobile visual verification was not performed.** The existing mobile design was a fixed bottom glass pill with icon + short-label triggers. The new structure has 5 text-only items (`首页 / AI 检测 / 服务状态 / 网络检测 / 浏览器检测`) with no icons, wrapped in the same pill. The mobile CSS rules were updated to retarget `.app-nav__items` / `.app-nav__link` / `.nav-group-dropdown__trigger` and the dropdown menu opens upward on ≤48rem (with `max-height: 60vh; overflow-y: auto`), but the actual rendering on a phone-sized viewport has not been eyeballed in this session — please reload on mobile to confirm the pill still looks reasonable.
- **Active highlight inside the mobile pill uses a background tint.** The previous gsap-animated highlight span is gone; the new approach applies a flat `color-mix(in srgb, var(--primary) 13%, transparent)` background to `.app-nav__link--active` and `.nav-group-dropdown.is-active .nav-group-dropdown__trigger` inside `@media (max-width: 48rem)`. This is the closest static equivalent but lacks the slide animation.
- **`<button>` wrapping a `<Link>` is invalid HTML** (the `<a>` lives inside the `<button>`). This follows the brief's pattern and works in practice; React emits no runtime warning, but a stricter lint pass or a validator may complain. A future refactor could split the trigger into two siblings (label link + chevron button) sharing a flex container.
- **`en.json` keeps an unused `"breadcrumb": "Breadcrumb"` key** (line 1713). Left in place since the brief asks for the smallest change and the key is harmless.
- **`useAvailableTools` is no longer called in `tool-layout.tsx`.** The hook is still imported and used by `views/home/index.tsx` and `views/module-overview.tsx`, so the file in `src/hooks/` was not touched.

## Report file path

`F:\博客文件\one-ip\.superpowers\sdd\2026-09-25-one-ip-ecosystem-ui-alignment\task-13-report.md`
