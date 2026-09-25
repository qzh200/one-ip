# Task 11 Brief — Fix IP reputation badge vertical centering

**Branch:** `feature/ecosystem-ui-alignment`
**Base SHA:** `84c536d` (Task 10 head — resolve via `git rev-parse HEAD` in `F:\博客文件\one-ip`)

## Context

User browser feedback (Comment 2): "IP信誉分上下不居中" — the IP reputation badge in the home page card is not vertically aligned with the IP address.

Current CSS at `F:\博客文件\one-ip\src\app.css` around line 4408:

```css
.home-address-row .ip-reputation-badge {
  position: absolute;
  top: 0; /* ← aligns to top of row, not vertical center */
  right: 0;
}
```

The badge has `display: flex; flex-direction: column-reverse` so the big score number sits above the small "IP 信誉分" label. With `top: 0`, the entire badge column is pushed to the top of the row, making it visually misaligned with the IP address that's typically mid-height.

## Goal

Vertically center the badge against the IP address (or the row, whichever looks right).

## Files to modify

1. `src/app.css` — update `.home-address-row .ip-reputation-badge` rule

## Steps

### Step 11.1: Read the current rule

Read `F:\博客文件\one-ip\src\app.css` around line 4408 to confirm the current state.

### Step 11.2: Replace the rule

Find the rule:

```css
.home-address-row .ip-reputation-badge {
  position: absolute;
  top: 0;
  right: 0;
}
```

Replace with:

```css
.home-address-row .ip-reputation-badge {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}
```

This anchors the badge's vertical center to the row's vertical center. Use `transform: translateY(-50%)` to compensate for `top: 50%`.

### Step 11.3: Test

```bash
cd F:\博客文件\one-ip
pnpm dev
```

Verify:

- [ ] The IP reputation badge (e.g., "99 IP 信誉分") is vertically centered with the IP address (e.g., "1.62.202.27")
- [ ] Both on home page cards (国内探测 and 外部探测)
- [ ] Mobile breakpoint (<768px): still looks reasonable
- [ ] No layout regression in the IP card

If the visual alignment looks off because the IP address isn't actually centered in the row (e.g., it's pushed down by padding/margin), report the issue but don't try further fixes in this task.

### Step 11.4: Commit

```bash
cd F:\博客文件\one-ip
git add src/app.css
git commit -m "fix(home): vertically center IP reputation badge"
```

## Constraints

- Don't introduce new runtime deps
- Don't touch view components (only CSS in this task)
- Don't change the badge's other properties (padding, color, font-size, etc.) — only the positioning

## Report contract

Write report to: `F:\博客文件\one-ip\.superpowers\sdd\2026-09-25-one-ip-ecosystem-ui-alignment\task-11-report.md`

Then reply with ONLY:

- **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Commit SHA + subject
- One-line test summary
- Concerns (if any)
- Report file path

## Working directory

`F:\博客文件\one-ip` (branch `feature/ecosystem-ui-alignment`).
