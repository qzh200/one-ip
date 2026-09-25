# Task 14 Brief — Click-only dropdown trigger + fully opaque submenu

**Branch:** `feature/ecosystem-ui-alignment`
**Base SHA:** `71531f8` (Task 13 head — resolve via `git rev-parse HEAD` in `F:\博客文件\one-ip`)

## Context

User feedback after viewing the new hover-dropdown submenu:

1. "点一下主菜单就显示子菜单" — they want click as the primary behavior (already in place, but hover causes confusion)
2. "子菜单背景透明度不对" — the submenu background still looks too transparent

## Goal

Two small CSS/JS tweaks:

1. Remove hover-trigger; click-only opens dropdown
2. Submenu background becomes fully opaque (no `--card-fill-solid`, no backdrop-filter blur)

## Files to modify

1. `src/components/nav-group-dropdown.tsx` — remove mouseenter/mouseleave handlers; click is the only trigger
2. `src/app.css` — change `.nav-group-dropdown__menu` background from `var(--card-fill-solid)` to a fully opaque color; remove the `backdrop-filter: blur(...)`

## Constraints

- Don't introduce new runtime deps
- Don't touch view components
- Click on the trigger button toggles dropdown open/closed
- Clicking on a sub-item navigates and closes dropdown (already works)
- Click outside closes dropdown (already works)

## Steps

### Step 14.1: Read current state

- `F:\博客文件\one-ip\src\components\nav-group-dropdown.tsx` (full)
- `F:\博客文件\one-ip\src\app.css` around line 243 (the `.nav-group-dropdown__menu` rule)

### Step 14.2: Update `nav-group-dropdown.tsx`

Remove the hover-trigger logic and the mouseenter/mouseleave handlers. Keep the click toggle and the click-outside-to-close.

The component should:

- Render a button (or trigger) that opens/closes the dropdown on click
- Show the label (e.g., "网络检测") inside the button
- Dropdown menu opens below
- Click on dropdown item navigates
- Click outside closes

Suggested final implementation (simplify aggressively):

```tsx
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type NavGroupTool = { path: string; label: string };

export function NavGroupDropdown({
  label,
  overviewPath, // e.g., "/ai", "/network"
  tools, // e.g., aiPlatforms.map(...) or toolGroups.network
  isActive, // highlight when on overviewPath or any tool's path
}: {
  label: string;
  overviewPath: string;
  tools: NavGroupTool[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "nav-group-dropdown",
        open && "is-open",
        isActive && "is-active",
      )}
    >
      <button
        type="button"
        className="nav-group-dropdown__trigger"
        onClick={() => setOpen((v) => !v)}
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

- Removed `onMouseEnter` / `onMouseLeave` from the wrapper div
- Removed `closeTimer` ref and `openNow` / `scheduleClose` functions
- Changed the trigger to be a simple `<button>` with `<span>` label (no nested `<Link>` — that was invalid HTML)

NOTE: This breaks the previous behavior where clicking the label navigated to overview while clicking the caret opened the menu. The new behavior: click anywhere on the trigger button toggles the dropdown. To navigate to overview, user clicks "概述" in the dropdown.

### Step 14.3: Update `src/app.css`

Find the `.nav-group-dropdown__menu` rule (around line 243):

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
  background: var(--card-fill-solid); /* ← 96% opaque */
  -webkit-backdrop-filter: blur(var(--card-blur, 18px));
  backdrop-filter: blur(var(--card-blur, 18px)); /* ← remove this blur */
  box-shadow: 0 14px 32px -24px rgb(var(--shadow) / 0.55);
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
  border: 1px solid rgb(var(--line) / 0.5);
  background: var(--color-bg, #f4f6fe); /* solid, no transparency */
  box-shadow: 0 14px 32px -16px rgb(var(--shadow) / 0.6);
}
```

Key changes:

- `background: var(--card-fill-solid)` → `background: var(--color-bg, #f4f6fe)` (uses the same fully-opaque bg color as the page; this auto-switches with theme — light/dark)
- Removed `backdrop-filter: blur(...)` and `-webkit-backdrop-filter` (no blur = no see-through)

### Step 14.4: Test

```bash
cd F:\博客文件\one-ip
pnpm dev
```

Verify:

- [ ] Top nav tabs render normally
- [ ] Hovering over a group tab does NOT open dropdown anymore
- [ ] Clicking the group tab (e.g., "网络检测") toggles dropdown open/closed
- [ ] Dropdown background is fully opaque — page content behind is NOT visible through the dropdown
- [ ] Click outside the dropdown closes it
- [ ] Clicking a sub-item navigates
- [ ] Mobile: same behavior (tap to toggle)

### Step 14.5: Commit

```bash
cd F:\博客文件\one-ip
git add src/components/nav-group-dropdown.tsx src/app.css
git commit -m "fix(nav): click-only trigger, fully opaque submenu background"
```

## Report contract

Write report to: `F:\博客文件\one-ip\.superpowers\sdd\2026-09-25-one-ip-ecosystem-ui-alignment\task-14-report.md`

Then reply with ONLY:

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED
- Commit SHA + subject
- One-line test summary
- Concerns (if any)
- Report file path

## Working directory

`F:\博客文件\one-ip` (branch `feature/ecosystem-ui-alignment`).
