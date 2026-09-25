# Task 10 Brief — Strip nav: remove logo + share + language

**Branch:** `feature/ecosystem-ui-alignment`
**Base SHA:** `3e78014` (Task 8 head — resolve via `git rev-parse HEAD` in `F:\博客文件\one-ip`)

## Context

After the user reviewed the running dev server output (browser feedback), they requested three post-implementation adjustments:

1. **Remove the QR-code share button** (currently `<ShareSite />` in nav)
2. **Remove the Chinese/English language switcher** (currently `<LanguageSelect />` in nav)
3. **Remove the logo entirely** — match the other ecosystem sites (hoshiumi_drive/stats/home have no prominent logo in their nav)

This simplifies the top nav to just the 5 tabs (`概览 / AI 检测 / 服务状态 / 网络检测 / 浏览器检测`). The BackLink (top-left, fixed) and ThemeToggleButton (top-right, fixed) remain.

## Files to modify

1. `src/layout/index.tsx` — remove logo, ShareSite, LanguageSelect from both desktop nav and mobile header

## Steps

### Step 10.1: Read current state

Read `F:\博客文件\one-ip\src\layout\index.tsx` (full file, ~225 lines).

Locate:

- Imports for `ShareSite` and `LanguageSelect`
- `mobile-site-header` block (top of return JSX)
- `<nav className="app-nav">` block with its `desktop-preferences` div

### Step 10.2: Remove imports

Remove these two import lines from the imports section:

```ts
import { LanguageSelect } from "@/components/language-select";
import { ShareSite } from "@/components/share-site";
```

### Step 10.3: Strip the mobile-site-header

The current `mobile-site-header` looks like:

```tsx
<header className="mobile-site-header">
  <Link to="/" className="..." aria-label={t("IP 网络工具概览")}>
    <img src="/icon.svg" width="24" height="24" alt="" />
  </Link>
  <div className="flex items-center gap-1">
    <ShareSite />
    <LanguageSelect />
    <ThemeToggleButton className="size-8 rounded-full text-muted-foreground" />
  </div>
</header>
```

Remove the entire `<Link to="/" ...>` (logo) AND the `<div className="flex items-center gap-1">` block (share + language). The ThemeToggleButton in the mobile header should also be removed because Task 7 already moved it to fixed top-right.

After cleanup, the `mobile-site-header` may become empty. **If it has no children left, remove the entire `<header>` element.** But check first — if there's anything else in it, preserve that.

### Step 10.4: Strip the desktop nav

The current desktop `<nav className="app-nav">` looks like:

```tsx
<nav ref={navRef} className="app-nav" aria-label={t("主导航")}>
  {mobile && (
    <Suspense fallback={null}>
      <MobileNavGlass light={resolvedTheme === "light"} />
    </Suspense>
  )}
  <Link to="/" aria-label={t("IP 网络工具概览")} className="site-home-link ...">
    <img src="/icon.svg" alt="" width="32" height="32" />
  </Link>
  <ScrollArea className="nav-tabs-scroll">
    {list}
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
  <div className="desktop-preferences flex items-center gap-1">
    <ShareSite />
    <LanguageSelect />
    <ThemeToggleButton className="..." />
  </div>
</nav>
```

Remove:

- The `<Link to="/" ...><img .../></Link>` (logo)
- The `<div className="desktop-preferences ...">` block entirely (share + language + theme; theme was already moved to fixed in Task 7)

KEEP:

- The `{mobile && <Suspense>...<MobileNavGlass /></Suspense>}` block (it's the mobile-specific nav effect)
- The `<ScrollArea className="nav-tabs-scroll">` block (the actual tab list)

After cleanup, the nav is: MobileNavGlass (mobile only) + ScrollArea with tabs.

### Step 10.5: Remove the `useTheme` import if no longer needed

The `resolvedTheme` variable from `useTheme()` is currently only used by:

- `<MobileNavGlass light={resolvedTheme === "light"} />` (KEEP this; resolvedTheme still needed)
- (Anywhere else? grep before removing.)

If `resolvedTheme` is still needed for MobileNavGlass, keep the `useTheme()` call.

### Step 10.6: Test

```bash
cd F:\博客文件\one-ip
pnpm dev
```

Verify:

- [ ] Top nav has NO logo on the left side (just tabs starting from where logo used to be)
- [ ] Top nav has NO QR-code share button
- [ ] Top nav has NO language switcher (no 中/EN toggle)
- [ ] Mobile-site-header is gone (no top bar on mobile either, OR empty header removed)
- [ ] Tabs still work: click each tab, page navigates
- [ ] BackLink still top-left fixed
- [ ] ThemeToggleButton still top-right fixed
- [ ] No console errors (e.g., unused imports)

### Step 10.7: Commit

```bash
cd F:\博客文件\one-ip
git add src/layout/index.tsx
git commit -m "refactor(shell): strip logo + share + language from nav"
```

## Constraints

- Don't introduce new runtime deps
- Don't touch view components (the home page, IP card, etc.)
- Don't delete files unless truly orphaned
- If removing imports breaks typecheck (TS6133 unused-import), fix it (don't disable the lint rule)

## Report contract

Write report to: `F:\博客文件\one-ip\.superpowers\sdd\2026-09-25-one-ip-ecosystem-ui-alignment\task-10-report.md`

Then reply with ONLY:

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Commit SHA + subject
- One-line test summary (e.g. "logo + share + language removed; nav now has just tabs; both fixed corners intact")
- Concerns (if any)
- Report file path

## Working directory

`F:\博客文件\one-ip` (branch `feature/ecosystem-ui-alignment`).
