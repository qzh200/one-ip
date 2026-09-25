# Task 15 Brief — Restore hover + fix click + popup-matched background

**Branch:** `feature/ecosystem-ui-alignment`
**Base SHA:** `f33b82d` (Task 14 head — resolve via `git rev-parse HEAD` in `F:\博客文件\one-ip`)

## Context

User feedback after Task 14 (click-only, fully opaque):

1. Wants BOTH hover AND click (not click-only)
2. Click on the menu NAME (label) doesn't toggle the dropdown — only the caret does. User wants clicking anywhere on the trigger to work.
3. Submenu background should MATCH the popup/dialog background (which is `var(--card-fill-solid)` = 96% opaque, with backdrop blur)

## Goal

Three tweaks:

1. **Add hover-trigger back** (mouseenter on the wrapper opens, mouseleave closes with delay)
2. **Click toggles the whole trigger** — clicking the label `<span>` must fire the button's onClick
3. **Submenu background = `var(--card-fill-solid)` + backdrop-blur** (matches the dialog popup style we set up in Task 11)

## Files to modify

1. `src/components/nav-group-dropdown.tsx` — add hover handlers back, ensure click works on whole button
2. `src/app.css` — change submenu background to `var(--card-fill-solid)` + backdrop-blur

## Constraints

- Don't introduce new runtime deps
- Don't touch view components
- Click must toggle on label click AND caret click (whole button area)
- Hover must open dropdown (with a small mouseleave delay so user can move into the menu)
- Submenu must visually match popups: `var(--card-fill-solid)` background, `backdrop-filter: blur(var(--card-blur, 18px))`

## Steps

### Step 15.1: Read current state

- `F:\博客文件\one-ip\src\components\nav-group-dropdown.tsx` (full)
- `F:\博客文件\one-ip\src\app.css` around line 243 (the `.nav-group-dropdown__menu` rule)

### Step 15.2: Update `nav-group-dropdown.tsx`

Add back hover-trigger logic. Keep click toggle. Ensure click works on whole button (verify the `<button>` wraps both `<span>` and `<ChevronDown>`).

```tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type NavGroupTool = { path: string; label: string };

/**
 * Top-nav group trigger with hover AND click submenu.
 *
 * Behavior:
 * - Opens on mouseenter on the wrapper, closes on mouseleave (with 150ms delay so
 *   the user can move the cursor into the menu).
 * - Click on the trigger button (label or caret) toggles open/closed.
 * - Closes on Escape and on `mousedown` outside the wrapper.
 */
export function NavGroupDropdown({
  label,
  overviewPath,
  tools,
  isActive,
}: {
  label: string;
  overviewPath: string;
  tools: readonly NavGroupTool[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openNow() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 150);
  }

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      const node = containerRef.current;
      if (node && !node.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "nav-group-dropdown",
        open && "is-open",
        isActive && "is-active",
      )}
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="nav-group-dropdown__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="nav-group-dropdown__label">{label}</span>
        <ChevronDown aria-hidden="true" className="nav-group-dropdown__caret" />
      </button>
      {open && (
        <div className="nav-group-dropdown__menu" role="menu">
          <Link
            to={overviewPath}
            className="nav-group-dropdown__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {t("概述")}
          </Link>
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="nav-group-dropdown__item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {tool.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

Key changes:

- Added `onMouseEnter={openNow}` and `onMouseLeave={scheduleClose}` to the wrapper div
- Re-introduced `closeTimer` ref with 150ms delay
- Click behavior unchanged (whole button toggles)

### Step 15.3: Update `src/app.css` — `.nav-group-dropdown__menu` rule

Find the rule (around line 243):

```css
.nav-group-dropdown__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 180px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgb(var(--line) / 0.5);
  background: var(--color-bg, #f4f6fe); /* ← change this */
  box-shadow: 0 14px 32px -16px rgb(var(--shadow) / 0.6);
}
```

Replace with:

```css
.nav-group-dropdown__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 180px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgb(var(--line) / 0.4);
  background: var(--card-fill-solid);
  -webkit-backdrop-filter: blur(var(--card-blur, 18px));
  backdrop-filter: blur(var(--card-blur, 18px));
  box-shadow: 0 14px 32px -16px rgb(var(--shadow) / 0.6);
}
```

This now matches the popup/dialog background (96% opaque, glass blur), exactly like the popup/dialog components from Task 11.

### Step 15.4: Test

```bash
cd F:\博客文件\one-ip
pnpm dev
```

Verify:

- [ ] Hover over "网络检测" tab → dropdown appears
- [ ] Click anywhere on "网络检测" button (label or caret) → dropdown toggles open/closed
- [ ] Mouse leaves the dropdown area → closes after ~150ms (so user can move into the menu)
- [ ] Click outside → closes
- [ ] Escape key → closes
- [ ] Submenu background visually matches the popup/dialog background (slight glass blur, 96% opaque)
- [ ] When closed, no leftover dropdown

### Step 15.5: Commit

```bash
cd F:\博客文件\one-ip
git add src/components/nav-group-dropdown.tsx src/app.css
git commit -m "fix(nav): restore hover trigger; submenu matches popup background"
```

## Report contract

Write report to: `F:\博客文件\one-ip\.superpowers\sdd\2026-09-25-one-ip-ecosystem-ui-alignment\task-15-report.md`

Then reply with ONLY:

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED
- Commit SHA + subject
- One-line test summary (e.g. "hover + click both work; click toggles on label AND caret; submenu uses --card-fill-solid like popups")
- Concerns (if any)
- Report file path

## Working directory

`F:\博客文件\one-ip` (branch `feature/ecosystem-ui-alignment`).
