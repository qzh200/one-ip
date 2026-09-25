# Task 13 Brief — Replace breadcrumb+dropdown with hover-dropdown submenu

**Branch:** `feature/ecosystem-ui-alignment`
**Base SHA:** `8c218e9` (Task 12 head — resolve via `git rev-parse HEAD` in `F:\博客文件\one-ip`)

## Context

The user reviewed the breadcrumb + tools-dropdown layout from Task 12 and said:

- The dropdown showed ALL tools in ALL groups at once (too much information density)
- The breadcrumb looks ugly
- They want a classic "二级菜单" (hover-dropdown submenu) instead

## Goal

Replace the breadcrumb + tools-dropdown pattern with **hover-triggered dropdown submenus** under the top nav. The 3 group tabs (AI 检测 / 网络检测 / 浏览器检测) get dropdowns on hover/click showing their sub-tools. The 2 simple tabs (首页 / 服务状态) remain as direct links.

## Files to create / modify

1. **Delete (or gut):** `src/components/breadcrumb.tsx`
2. **Delete (or gut):** `src/components/tools-dropdown.tsx`
3. **Create:** `src/components/nav-group-dropdown.tsx` — hover/click dropdown for one top-nav group
4. **Modify:** `src/layout/index.tsx` — restructure top nav to include hover dropdowns
5. **Modify:** `src/layout/tool-layout.tsx` — remove the `<Breadcrumb>` and `<ToolsDropdown>` references from Task 12
6. **Modify:** `src/app.css` — remove breadcrumb/dropdown styles from Task 12; add nav-dropdown styles

## Constraints

- Don't introduce new runtime deps (lucide-react icons + shadcn DropdownMenu available)
- Don't touch view components
- Top nav must keep the active-tab highlighting (current group tab is highlighted when on a tool's page)
- The dropdown for a group should appear on hover (mouseenter) AND click (for touch / accessibility)
- Dropdown closes on mouseleave with a small delay (so user can move mouse to the dropdown without it closing)
- The 3 group tabs (AI / 网络 / 浏览器) MUST have hover dropdowns; the 2 simple tabs (首页 / 服务状态) do NOT

## Steps

### Step 13.1: Read current state

- `F:\博客文件\one-ip\src\layout\index.tsx` (full — to find where top nav is rendered)
- `F:\博客文件\one-ip\src\layout\tool-layout.tsx` (full)
- `F:\博客文件\one-ip\src\components\ui\dropdown-menu.tsx` (shadcn DropdownMenu API)
- `F:\博客文件\one-ip\src\components\animated-segmented-tabs.tsx` (current top nav rendering)
- `F:\博客文件\one-ip\src\app.css` (find Task 12 styles for `.content-header` / `.breadcrumb__*` / `.tools-dropdown__*` to remove)

### Step 13.2: Create `src/components/nav-group-dropdown.tsx`

A hover/click dropdown for one top-nav group:

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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

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
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="nav-group-dropdown__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Link
          to={overviewPath}
          className="nav-group-dropdown__label"
          onClick={(e) => {
            // Clicking the label navigates; the button wrapper handles the dropdown
            e.stopPropagation();
            setOpen(false);
          }}
        >
          {label}
        </Link>
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

### Step 13.3: Modify `src/layout/tool-layout.tsx`

Remove the `<Breadcrumb>` and `<ToolsDropdown>` references added in Task 12. Restore the original ToolLayout structure (no inline second-row nav — but also no replacement component). Just render `<PageHelpAlert />` and `<Outlet />`.

```tsx
import { Outlet } from "react-router-dom";
import { PageHelpAlert } from "@/components/page-help-alert";
import { useAvailableTools } from "@/hooks/use-available-tools";

export function ToolLayout(_props: { group: keyof typeof toolGroups }) {
  // useAvailableTools kept for any future side effects; can be removed if unused.
  useAvailableTools(_props.group);
  return (
    <>
      <PageHelpAlert />
      <Outlet />
    </>
  );
}
```

(Or simpler — just `<><PageHelpAlert /><Outlet /></>`. Use `useAvailableTools` only if other code depends on it being called here.)

### Step 13.4: Modify `src/layout/index.tsx` — replace top nav

Currently the top nav uses `<AnimatedSegmentedTabs>` for all 5 tabs. We need to:

- Keep the active-state behavior
- Add hover dropdowns to the 3 group tabs (AI 检测 / 网络检测 / 浏览器检测)
- Keep the 2 simple tabs (首页 / 服务状态) as plain links

Read the current AppLayout structure first (Step 13.1). The brief gives flexibility on exact implementation — the goal is the same.

**Approach**: Build the top nav manually instead of using `AnimatedSegmentedTabs`. Use `<NavGroupDropdown>` for the 3 groups and plain `<NavLink>` for the 2 simple items. Apply the active-state highlighting using `NavLink`'s `aria-current` or a manual check.

Example structure:

```tsx
import { NavLink, useLocation } from "react-router-dom";
import { NavGroupDropdown } from "@/components/nav-group-dropdown";
import { t } from "@/i18n";
import { aiPlatforms } from "@/views/ai/platforms";
import { toolGroups, navigationRoutes } from "./routes";

// In AppLayout, replace the existing nav rendering:

const { pathname } = useLocation();
const normalizedPath = pathname.replace(/\/+$/, "") || "/";

function isGroupActive(group: "network" | "browser" | "ai"): boolean {
  return (
    normalizedPath === `/${group}` ||
    toolGroups[group].some((t) => t.path === normalizedPath)
  );
}

// In JSX:
<nav className="app-nav" aria-label={t("主导航")}>
  <NavLink
    to="/"
    end
    className={({ isActive }) =>
      cn("app-nav__link", isActive && "app-nav__link--active")
    }
  >
    {t("首页")}
  </NavLink>

  <NavGroupDropdown
    label={t("AI 检测")}
    overviewPath="/ai"
    tools={toolGroups.ai}
    isActive={isGroupActive("ai")}
  />
  <NavLink
    to="/status"
    className={({ isActive }) =>
      cn("app-nav__link", isActive && "app-nav__link--active")
    }
  >
    {t("服务状态")}
  </NavLink>
  <NavGroupDropdown
    label={t("网络检测")}
    overviewPath="/network"
    tools={toolGroups.network}
    isActive={isGroupActive("network")}
  />
  <NavGroupDropdown
    label={t("浏览器检测")}
    overviewPath="/browser"
    tools={toolGroups.browser}
    isActive={isGroupActive("browser")}
  />
</nav>;
```

If the brief instructs to keep `<AnimatedSegmentedTabs>` for non-group tabs and use `<NavGroupDropdown>` for groups, adapt accordingly. The simplest is to drop `<AnimatedSegmentedTabs>` for the top nav and build it manually with the components above.

### Step 13.5: Update `src/app.css`

Remove all Task 12 styles (`.content-header`, `.breadcrumb__*`, `.tools-dropdown__*`). Add new styles:

```css
/* ====================================================================
 * Top nav: plain links + hover-dropdown submenus
 * ==================================================================== */
.app-nav__link {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.92rem;
  color: var(--ink-soft);
  text-decoration: none;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;
}

.app-nav__link:hover {
  color: var(--color-primary);
}

.app-nav__link--active {
  color: var(--color-primary);
  font-weight: 600;
}

.nav-group-dropdown {
  position: relative;
}

.nav-group-dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.92rem;
  font: inherit;
  background: transparent;
  border: 0;
  color: var(--ink-soft);
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;
}

.nav-group-dropdown__trigger:hover,
.nav-group-dropdown.is-open .nav-group-dropdown__trigger {
  color: var(--color-primary);
}

.nav-group-dropdown__label {
  color: inherit;
  text-decoration: none;
}

.nav-group-dropdown__caret {
  width: 14px;
  height: 14px;
  transition: transform 0.18s ease;
}

.nav-group-dropdown.is-open .nav-group-dropdown__caret {
  transform: rotate(180deg);
}

.nav-group-dropdown__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgb(var(--line) / var(--card-border-opacity, 0.4));
  background: var(--card-fill-solid);
  -webkit-backdrop-filter: blur(var(--card-blur, 18px));
  backdrop-filter: blur(var(--card-blur, 18px));
  box-shadow: 0 14px 32px -24px rgb(var(--shadow) / 0.55);
}

.nav-group-dropdown__item {
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--ink);
  text-decoration: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-group-dropdown__item:hover {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
}
```

### Step 13.6: Test

```bash
cd F:\博客文件\one-ip
pnpm dev
```

Verify:

- [ ] Top nav shows 5 items: 首页 / AI 检测 / 服务状态 / 网络检测 / 浏览器检测
- [ ] Hover over "网络检测" → dropdown appears below with 概述 + 7 tools
- [ ] Click a tool in dropdown → navigates
- [ ] Mouse leaves nav area → dropdown closes (with small delay so user can reach it)
- [ ] When on `/network/ping`: the "网络检测" trigger is highlighted (active state)
- [ ] Click "网络检测" label itself → navigates to `/network` (overview)
- [ ] Click outside the dropdown → it closes
- [ ] No breadcrumb row, no tools dropdown button — clean top nav only
- [ ] Mobile (375px): dropdowns still work but may need viewport adjustments (use `position: fixed` or similar)
- [ ] Keyboard accessibility: tab to a nav-group trigger, Enter/Space opens, arrow keys could navigate menu items (not strictly required but nice)

### Step 13.7: Commit

```bash
cd F:\博客文件\one-ip
git add src/components/breadcrumb.tsx src/components/tools-dropdown.tsx src/components/nav-group-dropdown.tsx src/layout/index.tsx src/layout/tool-layout.tsx src/app.css
git commit -m "refactor(shell): hover-dropdown submenu replaces breadcrumb + tools dropdown"
```

(If breadcrumb.tsx and tools-dropdown.tsx become empty stubs, delete them entirely with `git rm`.)

## Report contract

Write report to: `F:\博客文件\one-ip\.superpowers\sdd\2026-09-25-one-ip-ecosystem-ui-alignment\task-13-report.md`

Then reply with ONLY:

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Commit SHA + subject
- One-line test summary (e.g. "top nav with 3 hover-dropdown submenus; breadcrumb + tools-dropdown removed; active highlighting works")
- Concerns (if any)
- Report file path

## Working directory

`F:\博客文件\one-ip` (branch `feature/ecosystem-ui-alignment`).
