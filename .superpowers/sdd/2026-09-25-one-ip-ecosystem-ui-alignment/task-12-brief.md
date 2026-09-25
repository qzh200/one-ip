# Task 12 Brief — Replace sub-nav with breadcrumb + tools dropdown

**Branch:** `feature/ecosystem-ui-alignment`
**Base SHA:** `b807ad2` (Task 11 / card-fill alignment head — resolve via `git rev-parse HEAD` in `F:\博客文件\one-ip`)

## Context

The user reviewed the running dev server and found the two-level nav (top tabs + inline second row of sub-tools) visually awkward. Chose option C: "折叠成「面包屑 + 工具下拉」".

**Goal**: Remove the inline `<nav className="tool-subnav">` row from `ToolLayout` and replace with:

1. A breadcrumb at the top of the content area showing the current path
2. A "工具" dropdown button (next to the breadcrumb) that lists ALL tools in ALL groups, allowing jump-to-anywhere navigation

## Files to create / modify

1. **Create:** `src/components/breadcrumb.tsx`
2. **Create:** `src/components/tools-dropdown.tsx`
3. **Modify:** `src/layout/tool-layout.tsx` — remove sub-nav, add breadcrumb + dropdown
4. **Modify:** `src/app.css` — add `.breadcrumb` styles
5. **Modify:** `src/i18n/en.json` — add 2 new keys

## Constraints

- Don't introduce new runtime deps (lucide-react `ChevronRight` and `LayoutGrid` icons are already available; shadcn `DropdownMenu` exists)
- Don't touch view components
- The breadcrumb must work for all `ToolLayout` children: `/network/*`, `/browser/*`, `/ai/*`
- Status pages (`/status/*`) don't use `ToolLayout` so they don't get a breadcrumb — that's OK and out of scope

## Steps

### Step 12.1: Read current state

- `F:\博客文件\one-ip\src\layout\tool-layout.tsx` (full)
- `F:\博客文件\one-ip\src\layout\routes.ts` (full — has `toolGroups`, `navigationRoutes`, `activeNavigationRoute`)
- `F:\博客文件\one-ip\src\components\ui\dropdown-menu.tsx` (the shadcn DropdownMenu API — see how to use it)
- `F:\博客文件\one-ip\src\hooks\use-available-tools.ts` (helper for filtering tools)
- `F:\博客文件\one-ip\src\app.css` — find `.tool-subnav` rule to understand what's being removed

### Step 12.2: Create `src/components/breadcrumb.tsx`

Build a simple breadcrumb. Use `react-router-dom`'s `Link` for non-last items; the last item is plain text.

```tsx
import { Link } from "react-router-dom";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = {
  label: string;
  href?: string; // last item has no href
};

export function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="breadcrumb" className={cn("breadcrumb", className)}>
      <ol className="breadcrumb__list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="breadcrumb__item">
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="breadcrumb__current"
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="breadcrumb__link">
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <ChevronRight className="breadcrumb__sep" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### Step 12.3: Create `src/components/tools-dropdown.tsx`

Build a dropdown that shows ALL tools grouped by their parent group. Use shadcn's `DropdownMenu`.

```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "@/i18n";
import { toolGroups, navigationRoutes } from "@/layout/routes";
import { LayoutGrid, Check } from "lucide-react";

const GROUP_LABELS: Record<string, string> = {
  network: t("网络检测"),
  browser: t("浏览器检测"),
  ai: t("AI 检测"),
};

export function ToolsDropdown({ activePath }: { activePath: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="tools-dropdown__trigger">
          <LayoutGrid aria-hidden="true" />
          <span>{t("工具列表")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tools-dropdown__content">
        <DropdownMenuLabel>{t("导航")}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/" className="tools-dropdown__item">
            {t("首页")}
            {activePath === "/" && (
              <Check aria-hidden="true" className="ml-auto" />
            )}
          </Link>
        </DropdownMenuItem>
        {navigationRoutes.slice(1).map((route) => {
          if (route.value === "/status/") return null; // status has no group sub-tools
          const groupKey = route.value
            .replace(/\//g, "")
            .replace(/-/g, "") as keyof typeof toolGroups;
          const tools = toolGroups[groupKey];
          if (!tools) return null;
          return (
            <div key={route.value}>
              <DropdownMenuLabel>
                {GROUP_LABELS[groupKey] || route.label}
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={route.value} className="tools-dropdown__item">
                  {t("概述")}
                  {activePath === route.value && (
                    <Check aria-hidden="true" className="ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>
              {tools.map((tool) => (
                <DropdownMenuItem key={tool.path} asChild>
                  <Link to={tool.path} className="tools-dropdown__item">
                    {tool.label}
                    {activePath === tool.path && (
                      <Check aria-hidden="true" className="ml-auto" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Adjust as needed based on actual `dropdown-menu.tsx` API and `navigationRoutes` structure.

### Step 12.4: Modify `src/layout/tool-layout.tsx`

Replace the `<nav className="tool-subnav">...</nav>` block with breadcrumb + dropdown. Compute the breadcrumb items from the current `group` and (optional) current tool path.

```tsx
import { useLocation } from "react-router-dom";
import { NavLink, Outlet } from "react-router-dom";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHelpAlert } from "@/components/page-help-alert";
import { SiteLogo } from "@/components/site-logo";
import { ToolsDropdown } from "@/components/tools-dropdown";
import { useAvailableTools } from "@/hooks/use-available-tools";
import { t } from "@/i18n";
import { aiPlatforms } from "@/views/ai/platforms";
import { toolGroups } from "./routes";

const GROUP_LABELS: Record<keyof typeof toolGroups, string> = {
  network: t("网络检测"),
  browser: t("浏览器检测"),
  ai: t("AI 检测"),
};

export function ToolLayout({ group }: { group: keyof typeof toolGroups }) {
  const tools = useAvailableTools(group);
  const { pathname } = useLocation();
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const currentTool = tools.find((tool) => tool.path === cleanPath);

  const crumbs = [
    { label: t("首页"), href: "/" },
    { label: GROUP_LABELS[group], href: `/${group}` },
    ...(currentTool ? [{ label: currentTool.label }] : []),
  ];

  return (
    <>
      <div className="content-header">
        <Breadcrumb items={crumbs} />
        <ToolsDropdown activePath={cleanPath} />
      </div>
      <PageHelpAlert />
      <Outlet />
    </>
  );
}
```

(Remove the `SiteLogo` import if no longer needed.)

### Step 12.5: Add CSS in `src/app.css`

Append at the end of `src/app.css`:

```css
/* ====================================================================
 * Content header (breadcrumb + tools dropdown)
 * ==================================================================== */
.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 16px;
  flex-wrap: wrap;
}

.breadcrumb__list {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.breadcrumb__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb__link {
  color: var(--ink-soft);
  text-decoration: none;
  border-radius: 4px;
  padding: 2px 4px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.breadcrumb__link:hover {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.breadcrumb__current {
  color: var(--ink);
  font-weight: 600;
  padding: 2px 4px;
}

.breadcrumb__sep {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--ink-faint);
  opacity: 0.6;
}

.tools-dropdown__trigger {
  gap: 6px;
}

.tools-dropdown__content {
  min-width: 240px;
  max-height: 70vh;
  overflow-y: auto;
}

.tools-dropdown__item {
  display: flex;
  align-items: center;
  width: 100%;
}
```

### Step 12.6: Add i18n keys

Add to `src/i18n/en.json`:

```json
"工具列表": "Tools",
"导航": "Navigate",
```

Verify both keys are placed in a sensible spot (just append at end of file if unsure).

### Step 12.7: Test

```bash
cd F:\博客文件\one-ip
pnpm dev
```

Verify:

- [ ] On `/network/ping`: top nav shows "网络检测" active; content area shows breadcrumb "首页 / 网络检测 / 全球 Ping"; tools dropdown button visible top-right of content area
- [ ] Click tools dropdown: shows grouped menu — 首页 / 网络检测 (with 概述 + 7 tools) / 浏览器检测 (概述 + 6 tools) / AI 检测 (with Claude, GPT, etc.)
- [ ] Click a tool in dropdown: navigates correctly; dropdown closes
- [ ] Breadcrumb current page is highlighted
- [ ] The old `.tool-subnav` row is GONE
- [ ] Page content (`<Outlet />`) renders below the new content header
- [ ] Mobile (375px): breadcrumb wraps gracefully, dropdown button still accessible
- [ ] On `/ai/claude`: breadcrumb "首页 / AI 检测 / Claude" (or platform name)

### Step 12.8: Commit

```bash
cd F:\博客文件\one-ip
git add src/components/breadcrumb.tsx src/components/tools-dropdown.tsx src/layout/tool-layout.tsx src/app.css src/i18n/en.json
git commit -m "refactor(shell): replace sub-nav with breadcrumb + tools dropdown"
```

## Report contract

Write report to: `F:\博客文件\one-ip\.superpowers\sdd\2026-09-25-one-ip-ecosystem-ui-alignment\task-12-report.md`

Then reply with ONLY:

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Commit SHA + subject
- One-line test summary (e.g. "breadcrumb shows path; tools dropdown opens grouped menu; old sub-nav gone")
- Concerns (if any)
- Report file path

## Working directory

`F:\博客文件\one-ip` (branch `feature/ecosystem-ui-alignment`).
