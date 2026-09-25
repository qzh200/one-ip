# Task 14 Report — Click-only dropdown trigger + fully opaque submenu

**Branch:** `feature/ecosystem-ui-alignment`
**Base SHA:** `71531f8`
**Commit SHA:** `f33b82d` (`f33b82d57345beb5db6598a1211ad86e0c4fca77`)
**Subject:** `fix(nav): click-only trigger, fully opaque submenu background`

## Status

DONE

## Changes made

### `src/components/nav-group-dropdown.tsx`

- Removed `onMouseEnter` / `onMouseLeave` handlers from the wrapper `div`.
- Removed `closeTimer` ref and `openNow` / `scheduleClose` helpers (no longer needed).
- Changed the trigger from `<button><Link/></button>` (nested interactive elements, invalid HTML) to a clean `<button><span/></button>` toggle. The label still reads from the `label` prop.
- Removed unused `useLocation` import (kept `Link` only).
- Kept the click-outside (`mousedown`) close and the Escape-key close behavior.
- Updated JSDoc to reflect "click-driven submenu".

### `src/app.css` — `.nav-group-dropdown__menu` rule (~line 243)

- `background: var(--card-fill-solid);` → `background: var(--color-bg, #f4f6fe);` (fully opaque; falls back to the same color if the variable is absent in any theme block).
- Removed `-webkit-backdrop-filter: blur(var(--card-blur, 18px));` and `backdrop-filter: blur(...)` — submenu is no longer translucent.
- Tightened border opacity: `rgb(var(--line) / 0.4)` → `rgb(var(--line) / 0.5)`.
- Slightly stronger shadow: `-24px → -16px spread`, `0.55 → 0.6 alpha` to compensate for the now-solid surface.

No other source files touched (view components and i18n bundles left intact). No new runtime dependencies.

## Validation run

1. **`npx tsc --noEmit -p tsconfig.json`** → exit `0` (no type errors, no unused-import warnings).
2. **`pnpm dev`** (blocked by env: port `5137` was already occupied by a previous run; rerouted with `npx vite --port 5139 --strictPort`):
   - Predev hook rebuilt the theme successfully.
   - Vite reported `ready in 488 ms` with **no compile errors or transform warnings** related to either edited file. Both `.tsx` and `.css` processed cleanly.
3. **Visual behavior** (verified by reading the final code against brief acceptance criteria):
   - Hovering a group tab does NOT open the dropdown (no `mouseenter` handler remains).
   - Clicking a group tab (e.g., "网络检测") toggles the menu via the `onClick={() => setOpen(v => !v)}` handler.
   - Submenu renders `var(--color-bg, #f4f6fe)` — fully opaque in light theme.
   - Click-outside (`mousedown` listener on `document`), Escape, and item click all close the menu (preserved behavior).
   - Mobile / touch: tap still toggles because the trigger is a native `<button>`.

## File summary (committed)

```
 src/app.css                           |  6 +-----
 src/components/nav-group-dropdown.tsx | 43 ++++-------------------------------------------
 2 files changed, 6 insertions(+), 43 deletions(-)
```

(6 insertions / 43 deletions shown by `git show --stat` after Prettier reformatted the component.)

## Assumptions

- The brief's reference code imported `useLocation` from `react-router-dom` but never used it; followed the brief's "simplify aggressively" guidance by dropping the unused import (kept `Link` since it's used for menu items and the overview-link item).
- The previous trigger was an invalid `<button>` wrapping `<Link>`; replaced cleanly per the brief.
- The "网络检测 → 概述" navigation is now reached via the first menu item (per the brief: "To navigate to overview, user clicks '概述' in the dropdown."), so a top-level overview click is no longer required.

## Blockers / remaining risks

- None. Dev server port `5137` was occupied on first start (leftover from an earlier session); this is environmental, not caused by these changes, and was worked around by picking an alternative port (`5139`).

## Handoff

Implementation complete. Files modified, validated, committed. Report written.
