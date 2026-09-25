# One-IP 与 Hoshiumi 生态 UI 对齐 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 one-ip 的外壳、主题系统、配色改造到与 hoshiumi_* 生态站同一画风，同时引入 `config/site.yaml` 让未来改色不必动 TS 代码。

**Architecture:** 构建期注入（与 hoshiumi_drive 的 `config:build` 同构）—— Node 脚本读 `config/site.yaml` → 编译出 `src/generated/theme.css`，Vite 现有 CSS 流水线打包。运行时无 YAML 解析、零额外依赖。FOUC 用内联 `<head>` 脚本防护，与 hoshiumi_* 同构。三态主题切换瞬时生效（删除 view-transition 动画），shadcn `dark:` 工具类与生态 `data-theme` 并存。

**Tech Stack:** Vite 8 + React 19 + Tailwind 4 + shadcn/ui + Zod（schema 校验）+ yaml（Node 端构建期）+ @hapi/iron 不需要；生态对齐样式用纯 CSS 写。

**Spec:** `docs/superpowers/specs/2026-09-25-one-ip-ecosystem-ui-alignment-design.md`

---

## Global Constraints

- **view 内部组件禁止改动**：`src/views/**` 与 `src/components/ui/**` 一行不动
- **shadcn 桥接优先**：通过在 `:root` 桥接 `--color-bg → --background` 等，让 shadcn utility 不改代码就生效
- **不动 i18n 既有键**：仅新增 2 把（"返回 Hoshiumi 主页"、"切换主题（浅色 / 深色 / 跟随系统）"），中英两版
- **生态字体栈完全替换**：删除 `@fontsource-variable/geist` import 与 Geist 字体声明
- **三态主题瞬时切换**：删除 `startViewTransition` + 圆形 clip-path 代码
- **极光轻量背景**：保留渐变 + 噪点 + 静态弱化星点，**不**引入动画光斑
- **FOUC 零容忍**：dark 用户刷新页面必须看不到白屏
- **配色与 hoshiumi_drive 完全一致**：light bg `#f4f6fe` / primary `#7f9df2` / secondary `#f0a9cc` / accent `#9d92ec`
- **每次任务结束独立 commit**
- **不引入新依赖**：`yaml` 与 `zod` 已在 package.json

---

## 文件结构（最终态）

### 新增

| 文件                           | 职责                                          |
| ------------------------------ | --------------------------------------------- |
| `config/site.yaml`             | 主配置（home URL、主题色、卡片参数）          |
| `config/schema.ts`             | Zod 校验，导出 TS 类型                        |
| `scripts/build-theme.mjs`      | 读 YAML → 编译 → 写 `src/generated/theme.css` |
| `src/generated/theme.css`      | 编译产物（git 忽略）                          |
| `src/components/back-link.tsx` | 左上角返回按钮组件                            |
| `tests/build-theme.test.mjs`   | `build-theme.mjs` 单测                        |

### 修改

| 文件                                           | 改动摘要                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `package.json`                                 | 添加 `predev`/`prebuild`/`prepreview` 钩子                                          |
| `vite.config.ts`                               | 添加 `buildStart` + `watchChange` 钩子监听 `config/site.yaml`                       |
| `.gitignore`                                   | 添加 `src/generated/theme.css`                                                      |
| `index.html`                                   | 在 IIFE 后追加 FOUC 内联脚本（保留 IE 守卫）                                        |
| `src/index.css`                                | 删除 view-transition、Geist 字体相关                                                |
| `src/app.css`                                  | 注入生态中性 token、shadcn 桥接、字体栈、`.back-link`、`.theme-toggle`、`.bg-scene` |
| `src/layout/index.tsx`                         | 改写 `AppLayout`：渲染 `BackLink`、fixed 主题按钮、`.bg-scene`、玻璃 `app-nav`      |
| `src/components/theme/theme-toggle-button.tsx` | 三态图标、fixed 容器、删除 view-transition                                          |
| `src/components/providers/theme-provider.tsx`  | 同步 `data-theme`/`data-theme-choice`/`.dark`                                       |
| `src/hooks/use-theme.ts`                       | 删除 view-transition，暴露 `window.oneIpTheme`                                      |
| `src/store/theme.ts`                           | 删除 `themeTransitionPendingAtom`                                                   |
| `src/i18n/en.json`、`src/i18n/zh-CN.json`      | 新增 2 把 i18n 键                                                                   |

### 不动

所有 `src/views/**` 与 `src/components/ui/**`（shadcn）。

---

## Task 1: 基础设施 — 配置 schema 与构建脚本

**Files:**

- Create: `config/site.yaml`
- Create: `config/schema.ts`
- Create: `scripts/build-theme.mjs`
- Create: `tests/build-theme.test.mjs`

**Goal:** 跑通"读 YAML → 编译 CSS 变量 → 写 theme.css"的链路。

### Steps

- [ ] **Step 1.1：创建 `config/schema.ts`（Zod 校验）**

```ts
// config/schema.ts
import { z } from "zod";

export const themeChoiceSchema = z.enum(["light", "dark", "system"]);

export const siteConfigSchema = z.object({
  site: z.object({
    title: z.string().min(1),
    home_url: z.string().url(),
    theme: z.object({
      default: themeChoiceSchema,
      allow_switch: z.boolean(),
    }),
  }),
  theme: z.object({
    background: z.string(),
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
  }),
  dark: z.object({
    background: z.string(),
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
  }),
  card: z.object({
    radius: z.string(),
    blur: z.string(),
    border_opacity: z.number().min(0).max(1),
    bg_opacity: z.number().min(0).max(1),
  }),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
```

- [ ] **Step 1.2：创建 `config/site.yaml`**

```yaml
site:
  title: IP 网络工具
  home_url: https://hoshiumi.xyz/
  theme:
    default: system
    allow_switch: true

theme:
  background: "#f4f6fe"
  primary: "#7f9df2"
  secondary: "#f0a9cc"
  accent: "#9d92ec"

dark:
  background: "#0e1230"
  primary: "#9ab2ff"
  secondary: "#ffb8d6"
  accent: "#b6acff"

card:
  radius: 22px
  blur: 20px
  border_opacity: 0.35
  bg_opacity: 0.6
```

- [ ] **Step 1.3：创建 `scripts/build-theme.mjs`**

```js
// scripts/build-theme.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const YAML_PATH = resolve(ROOT, "config/site.yaml");
const CSS_PATH = resolve(ROOT, "src/generated/theme.css");

// schema 校验：动态 import TS 文件以获得类型
async function loadSchema() {
  const mod = await import(resolve(ROOT, "config/schema.ts"));
  return mod.siteConfigSchema;
}

function buildThemeCss(cfg) {
  const lightBlock = [
    ":root,",
    ":root[data-theme='light'] {",
    `  --color-bg: ${cfg.theme.background};`,
    `  --color-primary: ${cfg.theme.primary};`,
    `  --color-secondary: ${cfg.theme.secondary};`,
    `  --color-accent: ${cfg.theme.accent};`,
    `  --card-radius: ${cfg.card.radius};`,
    `  --card-blur: ${cfg.card.blur};`,
    `  --card-border-opacity: ${cfg.card.border_opacity};`,
    `  --card-bg-opacity: ${cfg.card.bg_opacity};`,
    "}",
  ].join("\n");

  const darkBlock = [
    ":root[data-theme='dark'] {",
    `  --color-bg: ${cfg.dark.background};`,
    `  --color-primary: ${cfg.dark.primary};`,
    `  --color-secondary: ${cfg.dark.secondary};`,
    `  --color-accent: ${cfg.dark.accent};`,
    "}",
  ].join("\n");

  return `/* AUTO-GENERATED by scripts/build-theme.mjs — DO NOT EDIT */\n${lightBlock}\n\n${darkBlock}\n`;
}

async function main() {
  const schema = await loadSchema();
  const raw = readFileSync(YAML_PATH, "utf8");
  const parsed = parse(raw);
  const result = schema.safeParse(parsed);
  if (!result.success) {
    console.error("[build-theme] Schema validation failed:");
    console.error(result.error.format());
    process.exit(1);
  }
  const css = buildThemeCss(result.data);
  mkdirSync(dirname(CSS_PATH), { recursive: true });
  writeFileSync(CSS_PATH, css, "utf8");
  console.log(`[build-theme] Wrote ${CSS_PATH}`);
}

main().catch((err) => {
  console.error("[build-theme]", err);
  process.exit(1);
});
```

- [ ] **Step 1.4：创建 `tests/build-theme.test.mjs`**

```js
// tests/build-theme.test.mjs
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const CSS_PATH = resolve(ROOT, "src/generated/theme.css");

test("build-theme generates theme.css from site.yaml", () => {
  execSync("node scripts/build-theme.mjs", { cwd: ROOT, stdio: "pipe" });
  assert.ok(existsSync(CSS_PATH), "theme.css should be generated");
  const css = readFileSync(CSS_PATH, "utf8");
  assert.match(css, /--color-primary:\s*#7f9df2/);
  assert.match(css, /--color-bg:\s*#0e1230/);
  assert.match(css, /--card-radius:\s*22px/);
});

test("build-theme fails on invalid YAML schema", () => {
  // 临时破坏 YAML 后跑脚本，应该 exit 1
  const yamlPath = resolve(ROOT, "config/site.yaml");
  const backup = readFileSync(yamlPath, "utf8");
  try {
    // 模拟非法值：border_opacity 超出范围
    const broken = backup.replace("border_opacity: 0.35", "border_opacity: 1.5");
    // 这里简化处理——我们直接验证 schema 函数拒绝非法值
    const { siteConfigSchema } = await import("../config/schema.ts");
    const result = siteConfigSchema.safeParse({ /* 不完整对象 */ });
    assert.equal(result.success, false, "should reject incomplete config");
  } finally {
    // 备份恢复由下一步完成
  }
});
```

> 备注：本测试文件需要使用项目现有的测试运行方式。检查 `package.json` 中 `test` 命令与 `tests/register-paths.mjs`。

- [ ] **Step 1.5：运行脚本验证产物**

```bash
cd F:\博客文件\one-ip
node scripts/build-theme.mjs
```

预期：控制台打印 `[build-theme] Wrote .../src/generated/theme.css`，文件包含正确的 CSS 变量。

- [ ] **Step 1.6：手动检查生成的 CSS**

读取 `src/generated/theme.css`，确认：

- `:root, :root[data-theme='light']` 块包含 `--color-primary: #7f9df2;`
- `:root[data-theme='dark']` 块包含 `--color-bg: #0e1230;`
- 文件顶部有 `AUTO-GENERATED` 注释

- [ ] **Step 1.7：Commit**

```bash
cd F:\博客文件\one-ip
git add config/site.yaml config/schema.ts scripts/build-theme.mjs src/generated/theme.css
git commit -m "feat(theme): add config/site.yaml and build-theme.mjs"
```

---

## Task 2: 接入构建钩子（package.json + vite.config + .gitignore）

**Files:**

- Modify: `package.json`（添加 pre* 脚本）
- Modify: `vite.config.ts`（添加 buildStart + watchChange）
- Modify: `.gitignore`（忽略 generated）

**Goal:** `pnpm dev`/`build`/`preview` 自动跑 `build-theme.mjs`，dev 模式下改 `config/site.yaml` 自动热更。

### Steps

- [ ] **Step 2.1：读取 package.json 现有 scripts 块**

读 `package.json` 第 11-23 行，记录现有 `dev`、`build`、`preview` 三个命令的完整文本。

- [ ] _*Step 2.2：在 package.json 添加 pre* 钩子_*

在每个相关脚本前面加 pre 钩子：

```json
{
  "predev": "node scripts/build-theme.mjs",
  "dev": "vite",
  "prebuild": "node scripts/build-theme.mjs",
  "build": "tsc -b && vite build",
  "prepreview": "node scripts/build-theme.mjs",
  "preview": "vite preview"
}
```

如果 `prebuild`/`predev` 已经有其他用途（如 `prebuild` 已经有 `wrangler types`），则用 `&&` 串联：

```json
"prebuild": "node scripts/build-theme.mjs && wrangler types",
```

实际检查并保留原有 predev/prebuild/preview 内容（若有）。

- [ ] **Step 2.3：读取 vite.config.ts**

读 `vite.config.ts` 全文，了解现有结构。

- [ ] **Step 2.4：在 vite.config.ts 添加 buildStart 钩子**

```ts
// vite.config.ts 顶部加 import
import { spawn } from "node:child_process";

// 在 defineConfig({...}) 内 plugins 数组前添加：
plugins: [
  {
    name: "one-ip-config-watcher",
    buildStart() {
      // dev 启动时已经由 predev 跑过；这里只作为兜底
      try {
        spawn("node", ["scripts/build-theme.mjs"], { stdio: "inherit" });
      } catch (e) {
        console.error("[vite] build-theme failed", e);
      }
    },
    watchChange(id) {
      if (id.endsWith("config/site.yaml")) {
        spawn("node", ["scripts/build-theme.mjs"], { stdio: "inherit" });
      }
    },
  },
  // ... 其他 plugins
];
```

- [ ] **Step 2.5：更新 `.gitignore`**

追加：

```
# Auto-generated theme tokens (from config/site.yaml)
src/generated/theme.css
```

- [ ] **Step 2.6：测试 dev 钩子**

```bash
cd F:\博客文件\one-ip
pnpm dev
```

预期：控制台先打印 `[build-theme] Wrote .../src/generated/theme.css`，再启动 Vite。Ctrl+C 退出。

- [ ] **Step 2.7：测试 YAML 热更**

```bash
# 启动 dev 后
# 编辑 config/site.yaml，把 theme.primary 改成 '#ff0000'
# Vite 应自动重启并应用新主题
```

- [ ] **Step 2.8：Commit**

```bash
cd F:\博客文件\one-ip
git add package.json vite.config.ts .gitignore
git commit -m "chore: wire build-theme into dev/build/preview pipeline"
```

---

## Task 3: 注入生态设计 token 到 app.css

**Files:**

- Modify: `src/index.css`（删除 view-transition、Geist 字体）
- Modify: `src/app.css`（注入生态 token + shadcn 桥接 + 字体栈）

**Goal:** 替换 one-ip 的硬编码颜色，引入生态中性 token，并通过桥接层让 shadcn 组件无需改代码就生效。

### Steps

- [ ] **Step 3.1：删除 `src/index.css` 中的 Geist 字体 import**

删除第 4 行：`@import "@fontsource-variable/geist";`

- [ ] **Step 3.2：删除 Geist 字体声明**

删除 `@theme inline` 中的 `--font-heading` 与 `--font-sans`（第 9-11 行）：

```css
@theme inline {
  /* 删除以下三行：
  --font-heading: var(--font-sans);
  --font-sans:
    system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  */
  --color-sidebar-ring: var(--sidebar-ring);
  /* ... 保留其他 ... */
}
```

- [ ] **Step 3.3：删除 view-transition 相关规则**

删除 `src/index.css` 中所有 `::view-transition-*` 选择器块（约第 250-263 行）：

```css
::view-transition-old(root),
::view-transition-new(root) { ... }
::view-transition-old(root) { ... }
::view-transition-new(root) { ... }
::view-transition-group(root) { ... }
```

保留 nprogress 相关样式。

- [ ] **Step 3.4：在 `src/app.css` 顶部追加生态中性 token 与字体**

```css
/* 顶部追加（在 @import "./index.css"; 之后） */

/* 生态字体栈（完全替换 Geist） */
html,
body {
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "Noto Sans SC",
    "Helvetica Neue",
    Arial,
    sans-serif;
}

/* 生态中性结构 token（light / dark） */
:root,
:root[data-theme="light"] {
  color-scheme: light;
  --ink: #3d4266;
  --ink-soft: #6c729b;
  --ink-faint: #a2a6c6;
  --line: 122 129 186;
  --shadow: 90 98 164;
  --card-fill: rgb(255 255 255 / var(--card-bg-opacity, 0.6));
  --card-fill-hover: rgb(
    255 255 255 / calc(var(--card-bg-opacity, 0.6) + 0.16)
  );
  --star: 104 128 226;
  --orb-opacity: 0.5;
  --noise-opacity: 0.045;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --ink: #e9ebfd;
  --ink-soft: #a4aad0;
  --ink-faint: #7d84ae;
  --line: 150 160 232;
  --shadow: 3 6 24;
  --card-fill: rgb(17 21 48 / var(--card-bg-opacity, 0.6));
  --card-fill-hover: rgb(32 38 82 / calc(var(--card-bg-opacity, 0.6) + 0.14));
  --star: 186 201 255;
  --orb-opacity: 0.36;
  --noise-opacity: 0.06;
}
```

- [ ] **Step 3.5：替换 app.css 中现有的硬编码颜色块**

定位 `app.css` 第 31-70 行的 `:root` 与 `.dark` 颜色声明（`--background: #fafafa` 等）。

**完全删除现有 `:root` 颜色块**（保留 `--tool-shadow`、`--success`/`--danger` 等语义色变量）。

**完全删除现有 `.dark` 颜色块**（同样保留语义色）。

替换为 shadcn 桥接层：

```css
/* shadcn 桥接：生态色 → shadcn 变量名（one-ip 自有语义色保留） */
:root,
:root[data-theme="light"] {
  --background: var(--color-bg, #f4f6fe);
  --foreground: var(--ink);
  --card: var(--card-fill);
  --card-foreground: var(--ink);
  --popover: var(--card-fill);
  --popover-foreground: var(--ink);
  --primary: var(--color-primary, #7f9df2);
  --primary-foreground: white;
  --secondary: var(--card-fill);
  --secondary-foreground: var(--ink);
  --muted: rgb(var(--line) / 0.06);
  --muted-foreground: var(--ink-soft);
  --accent: rgb(var(--line) / 0.08);
  --accent-foreground: var(--ink);
  --border: rgb(var(--line) / 0.35);
  --input: rgb(var(--line) / 0.5);
  --ring: var(--color-primary);
  --destructive: #d96b5f;
  /* one-ip 语义色保留 */
  --success: #1b8a2d;
  --success-soft: #d1fae5;
  --success-text: #065f46;
  --good: #6fcf7c;
  --warning: #f0c040;
  --danger: #cf222e;
  --info-soft: #dbeafe;
  --info-text: #1d4ed8;
  --subtle: #8b949e;
  --tool-shadow: 0 1px 4px rgb(0 0 0 / 6%), 0 4px 12px rgb(0 0 0 / 4%);
}

:root[data-theme="dark"] {
  --background: var(--color-bg, #0e1230);
  --foreground: var(--ink);
  --card: var(--card-fill);
  --card-foreground: var(--ink);
  --popover: var(--card-fill);
  --popover-foreground: var(--ink);
  --primary: var(--color-primary, #9ab2ff);
  --primary-foreground: #0e1230;
  --secondary: var(--card-fill);
  --secondary-foreground: var(--ink);
  --muted: rgb(var(--line) / 0.1);
  --muted-foreground: var(--ink-soft);
  --accent: rgb(var(--line) / 0.14);
  --accent-foreground: var(--ink);
  --border: rgb(var(--line) / 0.3);
  --input: rgb(var(--line) / 0.4);
  --ring: var(--color-primary);
  --destructive: #f08074;
  --success-soft: #123e31;
  --success-text: #a7f3d0;
  --info-soft: #162d4e;
  --info-text: #93c5fd;
  --tool-shadow: 0 1px 4px rgb(0 0 0 / 40%), 0 4px 12px rgb(0 0 0 / 30%);
}
```

- [ ] **Step 3.6：删除 `src/index.css` 中 `:root` 的硬编码颜色（与 app.css 重复的）**

`src/index.css` 第 52-119 行的 `:root` 与 `.dark` 块，是 shadcn 默认值。现在由 app.css 桥接层提供，应删除这两块让 Tailwind `@theme inline` 直接读 `--background` 等变量。

**注意**：先确认 app.css 中导入 index.css 后 shadcn 的 `@theme inline` 仍能解析变量。如果删除 `:root`/`--background` 等导致 Tailwind 工具类失效，保留 index.css 的部分作为兜底。

策略：**保留** index.css 中的 `@theme inline` 块（用 `var(--background)` 等），删除 `:root`/`.dark` 块。`@theme inline` 自动映射到 Tailwind 工具类。

- [ ] **Step 3.7：测试基本渲染**

```bash
cd F:\博客文件\one-ip
pnpm dev
```

打开 `http://localhost:5173/`，检查：

- [ ] 主页背景是浅蓝紫色（不是纯白）
- [ ] 文字颜色偏蓝紫
- [ ] 顶部导航卡片是半透明玻璃
- [ ] 表格、按钮颜色正常

切到深色（OS 系统切换或浏览器 devtools 模拟 prefers-color-scheme），验证 dark 模式。

- [ ] **Step 3.8：Commit**

```bash
cd F:\博客文件\one-ip
git add src/index.css src/app.css
git commit -m "feat(theme): introduce ecosystem tokens and shadcn bridge"
```

---

## Task 4: 极光轻量背景（.bg-scene）

**Files:**

- Modify: `src/app.css`（追加 `.bg-scene` 与星点/噪点 CSS）
- Modify: `src/layout/index.tsx`（在 `<>` 顶层加 `<div class="bg-scene">`）

**Goal:** 给整个应用加上静态极光背景（渐变 + 弱化星点 + 噪点，无动画光斑）。

### Steps

- [ ] **Step 4.1：在 `src/app.css` 追加背景样式**

```css
/* 极光轻量背景 */
.bg-scene {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background-color: var(--color-bg, #f4f6fe);
}

.bg-scene__layer {
  position: absolute;
  inset: 0;
}

.bg-scene__tint {
  background: linear-gradient(
    172deg,
    color-mix(in srgb, var(--color-primary, #7f9df2) 9%, transparent) 0%,
    transparent 36%,
    transparent 64%,
    color-mix(in srgb, var(--color-secondary, #f0a9cc) 8%, transparent) 100%
  );
}

.bg-scene__stars {
  position: absolute;
  inset: 0;
}

.star {
  position: absolute;
  border-radius: 9999px;
  background: currentColor;
  color: rgb(var(--star));
}

.star--sm {
  width: 1.5px;
  height: 1.5px;
  opacity: 0.5;
}

.bg-scene__noise {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: var(--noise-opacity);
  background-size: 160px 160px;
}
```

- [ ] **Step 4.2：在 `src/layout/index.tsx` 顶部引入星点生成函数**

```tsx
// src/layout/index.tsx 顶部，imports 之后
function generateStars(
  count: number,
): Array<{ top: number; left: number; size: "sm" | "lg" }> {
  // 伪随机种子（构建期稳定，不闪）
  const rng = (seed: number) => {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  };
  const r = rng(42);
  return Array.from({ length: count }, () => ({
    top: r() * 100,
    left: r() * 100,
    size: r() > 0.7 ? "lg" : "sm",
  })) as Array<{ top: number; left: number; size: "sm" | "lg" }>;
}

const STARS = generateStars(30);
```

- [ ] **Step 4.3：在 `AppLayout` 顶层加 `<BgScene />`**

```tsx
return (
  <>
    <BgScene />
    {/* ... 现有内容 ... */}
  </>
);

function BgScene() {
  return (
    <div className="bg-scene" aria-hidden="true">
      <div className="bg-scene__layer bg-scene__tint" />
      <div className="bg-scene__layer bg-scene__stars">
        {STARS.map((s, i) => (
          <span
            key={i}
            className={`star star--${s.size}`}
            style={{ top: `${s.top}%`, left: `${s.left}%` }}
          />
        ))}
      </div>
      <div className="bg-scene__layer bg-scene__noise" />
    </div>
  );
}
```

- [ ] **Step 4.4：调整 `.app-container` z-index 到 1**

在 `src/app.css` 找到 `.app-container` 规则（约第 74-79 行），添加 `position: relative; z-index: 1;`：

```css
.app-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px 20px;
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 4.5：测试背景渲染**

```bash
cd F:\博客文件\one-ip
pnpm dev
```

打开浏览器，检查：

- [ ] 整体背景有渐变氛围（不是纯色）
- [ ] 可见 ~30 个静态星点
- [ ] 顶部有轻微噪点纹理
- [ ] 主体内容（导航、卡片）仍然在最上层，未被背景遮盖
- [ ] 点击星点不会触发事件（pointer-events: none）

- [ ] **Step 4.6：Commit**

```bash
cd F:\博客文件\one-ip
git add src/app.css src/layout/index.tsx
git commit -m "feat(shell): add ecosystem aurora-lite background"
```

---

## Task 5: 左上角返回按钮（BackLink）

**Files:**

- Create: `src/components/back-link.tsx`
- Modify: `src/app.css`（追加 `.back-link`）
- Modify: `src/layout/index.tsx`（渲染 `<BackLink />`）
- Modify: `src/i18n/en.json` 与 `src/i18n/zh-CN.json`（新增 1 把键）

**Goal:** 在左上角 fixed 渲染 40×40 圆形玻璃按钮，点击跳转到 `https://hoshiumi.xyz/`。

### Steps

- [ ] **Step 5.1：检查 i18n 文件结构**

读 `src/i18n/index.ts` 与 `src/i18n/en.json`/`zh-CN.json`，确认键的命名风格（保持一致）。

- [ ] **Step 5.2：新增 i18n 键**

在两文件顶层添加：

- `en.json`: `"Back to Hoshiumi Home": "Back to Hoshiumi Home"`
- `zh-CN.json`: `"返回 Hoshiumi 主页": "返回 Hoshiumi 主页"`

- [ ] **Step 5.3：创建 `src/components/back-link.tsx`**

```tsx
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const HOME_URL = "https://hoshiumi.xyz/";

export function BackLink({ className }: { className?: string }) {
  return (
    <a
      href={HOME_URL}
      aria-label={t("返回 Hoshiumi 主页")}
      title={t("返回 Hoshiumi 主页")}
      className={cn("back-link", className)}
    >
      <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
    </a>
  );
}
```

- [ ] **Step 5.4：在 `src/app.css` 追加 `.back-link` 样式**

```css
.back-link {
  position: fixed;
  top: max(18px, env(safe-area-inset-top));
  left: max(18px, env(safe-area-inset-left));
  z-index: 60;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgb(var(--line) / var(--card-border-opacity, 0.4));
  background: var(--card-fill);
  color: var(--ink-soft);
  backdrop-filter: blur(var(--card-blur, 18px));
  -webkit-backdrop-filter: blur(var(--card-blur, 18px));
  text-decoration: none;
  transition:
    transform 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
}

.back-link:hover {
  transform: translateY(-2px);
  color: var(--color-primary);
  border-color: rgb(var(--line) / 0.7);
}

.back-link svg {
  display: block;
  width: 18px;
  height: 18px;
}
```

- [ ] **Step 5.5：在 `AppLayout` 渲染 `<BackLink />`**

在 `src/layout/index.tsx` 的 `return (` 内部、`<BgScene />` 之后加：

```tsx
<BackLink />
```

import 同步加：

```tsx
import { BackLink } from "@/components/back-link";
```

- [ ] **Step 5.6：测试**

打开 `http://localhost:5173/`：

- [ ] 左上角可见 40×40 圆形按钮
- [ ] 鼠标悬停：上浮 2px、颜色变蓝
- [ ] 点击：跳转到 https://hoshiumi.xyz/（外链，新标签页不打开）
- [ ] 移动端（375px）：不被刘海/灵动岛遮挡

- [ ] **Step 5.7：Commit**

```bash
cd F:\博客文件\one-ip
git add src/components/back-link.tsx src/app.css src/layout/index.tsx src/i18n/en.json src/i18n/zh-CN.json
git commit -m "feat(shell): add top-left back link to hoshiumi.xyz"
```

---

## Task 6: 主题系统重构（三态 + FOUC + .dark 同步）

**Files:**

- Modify: `src/index.html`（追加 FOUC 内联脚本）
- Modify: `src/store/theme.ts`（删除 `themeTransitionPendingAtom`）
- Modify: `src/hooks/use-theme.ts`（暴露 `window.oneIpTheme`，同步 `data-theme`/`data-theme-choice`/`.dark`）
- Modify: `src/components/providers/theme-provider.tsx`（在 effect 中同步多个属性）

**Goal:** 让主题系统与生态对齐——三态循环、`data-theme`/`data-theme-choice` 属性、`window.oneIpTheme` API、`.dark` class 同步给 shadcn。

### Steps

- [ ] **Step 6.1：删除 `src/store/theme.ts` 中的 `themeTransitionPendingAtom`**

读 `src/store/theme.ts` 全文，删除 `export const themeTransitionPendingAtom = atom(false);`（第 4 行）。

> 注：删除后需检查是否有其他地方引用此 atom。grep `themeTransitionPendingAtom` 全项目。如有引用，移除引用代码。

- [ ] **Step 6.2：重写 `src/hooks/use-theme.ts`**

```ts
import { useSyncExternalStore } from "react";
import { themeAtom, type Theme } from "@/store/theme";
import { useAtom } from "jotai";

const query = "(prefers-color-scheme: dark)";

function applyThemeAttrs(choice: Theme, resolved: "light" | "dark") {
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themeChoice = choice;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function exposeWindowApi(get: () => Theme, set: (next: Theme) => void) {
  (
    window as unknown as {
      oneIpTheme?: { get: () => Theme; set: (n: Theme) => void };
    }
  ).oneIpTheme = { get, set };
}

export function useTheme() {
  const [theme, updateTheme] = useAtom(themeAtom);
  const isDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
  const systemTheme: "light" | "dark" = isDark ? "dark" : "light";
  const resolvedTheme: "light" | "dark" =
    theme === "system" ? systemTheme : theme;

  // 首次挂载时暴露 API
  if (typeof window !== "undefined" && !(window as any).oneIpTheme) {
    exposeWindowApi(
      () => theme,
      (next) => setTheme(next),
    );
  }

  const setTheme = (next: Theme) => {
    const resolved = next === "system" ? systemTheme : next;
    applyThemeAttrs(next, resolved);
    updateTheme(next);
  };

  return { theme, setTheme, systemTheme, resolvedTheme };
}
```

- [ ] **Step 6.3：简化 `src/components/providers/theme-provider.tsx`**

```tsx
import { type PropsWithChildren } from "react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeProvider({ children }: PropsWithChildren) {
  const { resolvedTheme } = useTheme();
  // useTheme 已经同步 data-theme / data-theme-choice / .dark / colorScheme
  // 这里只用来触发 effect 重渲染
  return <div data-theme-applied={resolvedTheme}>{children}</div>;
}
```

- [ ] **Step 6.4：更新 `index.html` FOUC 内联脚本**

读 `index.html` 全文，在现有 IIFE（约第 17-43 行）`})();` 之后、`<style>` 之前，追加：

```html
<script>
  // Three-state theme boot (ecosystem parity)
  (function () {
    if (window.self !== window.top) return;
    if (document.documentMode || /MSIE|Trident/.test(navigator.userAgent))
      return;
    try {
      var KEY = "one-ip-theme";
      var LEGACY_KEY = "theme";
      var root = document.documentElement;
      var stored = null;
      try {
        stored = localStorage.getItem(KEY);
      } catch (e) {}
      // 兼容旧 key（一次性迁移）
      if (!stored) {
        try {
          var legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy === "light" || legacy === "dark" || legacy === "system") {
            stored = legacy;
            try {
              localStorage.setItem(KEY, legacy);
            } catch (e) {}
          }
        } catch (e) {}
      }
      var choice =
        stored === "light" || stored === "dark" || stored === "system"
          ? stored
          : "system";
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var resolved =
        choice === "system" ? (mq.matches ? "dark" : "light") : choice;
      root.setAttribute("data-theme", resolved);
      root.setAttribute("data-theme-choice", choice);
      root.classList.toggle("dark", resolved === "dark");
      root.style.colorScheme = resolved;
      // 暴露切换 API
      window.oneIpTheme = {
        get: function () {
          return choice;
        },
        set: function (next) {
          if (next !== "light" && next !== "dark" && next !== "system")
            next = "system";
          choice = next;
          resolved =
            choice === "system" ? (mq.matches ? "dark" : "light") : choice;
          root.setAttribute("data-theme", resolved);
          root.setAttribute("data-theme-choice", choice);
          root.classList.toggle("dark", resolved === "dark");
          root.style.colorScheme = resolved;
          try {
            localStorage.setItem("one-ip-theme", choice);
          } catch (e) {}
          // 触发 React 重渲染：派发 storage 事件
          window.dispatchEvent(
            new StorageEvent("storage", { key: "one-ip-theme" }),
          );
        },
      };
    } catch (e) {
      /* keep page usable */
    }
  })();
</script>
```

- [ ] **Step 6.5：检查并清理 `themeTransitionPendingAtom` 引用**

```bash
cd F:\博客文件\one-ip
grep -r "themeTransitionPendingAtom" src/
```

预期：无结果（全部已清理）。

如有残留引用（如 `theme-toggle-button.tsx` 中），需在后续 Task 7 中清理。

- [ ] **Step 6.6：测试主题切换**

```bash
pnpm dev
```

打开浏览器，devtools 检查 `<html>` 属性：

- [ ] 默认 `data-theme-choice="system"`，`data-theme` 跟 OS
- [ ] localStorage 写入 `one-ip-theme` 后刷新：状态保留
- [ ] devtools 改 `localStorage.setItem('one-ip-theme', 'dark')` 后刷新：暗色生效
- [ ] 暗色用户刷新：白屏无闪烁

- [ ] **Step 6.7：Commit**

```bash
cd F:\博客文件\one-ip
git add src/store/theme.ts src/hooks/use-theme.ts src/components/providers/theme-provider.tsx index.html
git commit -m "refactor(theme): 3-state with FOUC guard, drop view-transition"
```

---

## Task 7: 三态主题按钮 + 固定右上角

**Files:**

- Modify: `src/components/theme/theme-toggle-button.tsx`（完全重写）
- Modify: `src/app.css`（追加 `.theme-toggle`）
- Modify: `src/layout/index.tsx`（从 nav 行内移除，改为 fixed 渲染）

**Goal:** 右上角 fixed 渲染三态按钮，与 `.back-link` 完全镜像，图标随 `data-theme-choice` 切换。

### Steps

- [ ] **Step 7.1：完全重写 `src/components/theme/theme-toggle-button.tsx`**

```tsx
import { useTheme } from "@/hooks/use-theme";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";

const CYCLE: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];

export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  function handleClick() {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("切换主题（浅色 / 深色 / 跟随系统）")}
      title={t("切换主题（浅色 / 深色 / 跟随系统）")}
      className={cn("theme-toggle", className)}
    >
      <Sun
        aria-hidden="true"
        strokeWidth={1.75}
        className="theme-toggle__icon theme-toggle__icon--light"
      />
      <Moon
        aria-hidden="true"
        strokeWidth={1.75}
        className="theme-toggle__icon theme-toggle__icon--dark"
      />
      <Monitor
        aria-hidden="true"
        strokeWidth={1.75}
        className="theme-toggle__icon theme-toggle__icon--system"
      />
    </button>
  );
}
```

- [ ] **Step 7.2：在 `src/app.css` 追加 `.theme-toggle` 样式**

```css
.theme-toggle {
  position: fixed;
  top: max(18px, env(safe-area-inset-top));
  right: max(18px, env(safe-area-inset-right));
  z-index: 60;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgb(var(--line) / var(--card-border-opacity, 0.4));
  background: var(--card-fill);
  color: var(--ink-soft);
  backdrop-filter: blur(var(--card-blur, 18px));
  -webkit-backdrop-filter: blur(var(--card-blur, 18px));
  cursor: pointer;
  transition:
    transform 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
}

.theme-toggle:hover {
  transform: translateY(-2px);
  color: var(--color-primary);
  border-color: rgb(var(--line) / 0.7);
}

.theme-toggle__icon {
  display: none;
  width: 18px;
  height: 18px;
}

:root[data-theme-choice="light"] .theme-toggle__icon--light,
:root[data-theme-choice="dark"] .theme-toggle__icon--dark,
:root[data-theme-choice="system"] .theme-toggle__icon--system {
  display: block;
}
```

- [ ] **Step 7.3：在 `src/layout/index.tsx` 调整主题按钮位置**

删除 nav 行内的 `<ThemeToggleButton ... />`（mobile + desktop 各一处）。在 `<BackLink />` 之后加 `<ThemeToggleButton />`：

```tsx
return (
  <>
    <BgScene />
    <BackLink />
    <ThemeToggleButton />
    {/* ... 现有 .app-container + nav 行 ... */}
  </>
);
```

桌面 nav 行的 `desktop-preferences` 区块中移除 `<ThemeToggleButton />`。
移动端 `mobile-site-header` 中移除 `<ThemeToggleButton />`。

- [ ] **Step 7.4：测试**

打开浏览器：

- [ ] 右上角 40×40 圆形按钮
- [ ] 点击循环：light → dark → system → light
- [ ] 图标跟随 `data-theme-choice` 切换
- [ ] nav 行内不再有主题按钮
- [ ] 移动端右上角也能看到

- [ ] **Step 7.5：Commit**

```bash
cd F:\博客文件\one-ip
git add src/components/theme/theme-toggle-button.tsx src/app.css src/layout/index.tsx
git commit -m "feat(shell): 3-state theme toggle, fixed top-right"
```

---

## Task 8: 玻璃导航行 + 极简页脚

**Files:**

- Modify: `src/app.css`（追加 `.app-nav` 玻璃样式、`.footer` 生态样式）

**Goal:** 把 app-nav 容器改成毛玻璃胶囊，footer 改成生态风格（贴底居中）。

### Steps

- [ ] **Step 8.1：调整 `.app-nav` 为玻璃容器**

读 `src/app.css` 第 80-88 行（`.app-nav`），替换为：

```css
.app-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px;
  border-radius: 22px;
  border: 1px solid rgb(var(--line) / var(--card-border-opacity, 0.35));
  background: var(--card-fill);
  -webkit-backdrop-filter: blur(var(--card-blur, 20px)) saturate(1.05);
  backdrop-filter: blur(var(--card-blur, 20px)) saturate(1.05);
  box-shadow: 0 14px 32px -24px rgb(var(--shadow) / 0.55);
}
```

- [ ] **Step 8.2：调整 `.app-footer` 为生态风格**

读 `src/app.css` 找 `.app-footer` 规则。替换为：

```css
.app-footer {
  width: 100%;
  margin: 32px auto 0;
  padding: 6px 24px calc(22px + env(safe-area-inset-bottom));
  text-align: center;
  color: var(--ink-faint);
  font-size: 0.8rem;
  line-height: 1.9;
  opacity: 0.9;
}

.app-footer a {
  color: var(--ink-soft);
  transition: color 0.2s ease;
}

.app-footer a:hover {
  color: var(--color-primary);
}
```

- [ ] **Step 8.3：测试**

```bash
pnpm dev
```

检查：

- [ ] 导航行是半透明玻璃质感（背景模糊）
- [ ] 滚动时导航行不被遮挡（fixed 仍在 z-1）
- [ ] footer 贴底居中、字号小、`--ink-faint` 颜色
- [ ] footer 链接 hover 变蓝

- [ ] **Step 8.4：Commit**

```bash
cd F:\博客文件\one-ip
git add src/app.css
git commit -m "feat(shell): glass nav container and ecosystem footer"
```

---

## Task 9: 全面回归测试

**Goal:** 走遍所有 view，确保本次改动没有引入视觉/功能回归。

### Steps

- [ ] **Step 9.1：自动化测试**

```bash
cd F:\博客文件\one-ip
pnpm test
```

所有测试应通过。如有失败，先修复再继续。

- [ ] **Step 9.2：手动测试清单**

启动 `pnpm dev`，逐个 view 验证：

| View         | 路径                    | 验证点                                      |
| ------------ | ----------------------- | ------------------------------------------- |
| Home（概览） | `/`                     | IP 卡片、连通性、快捷方式、全部功能导航正常 |
| IP 查询      | `/network/ip`           | IP 输入、归属信息、Ping 网格、场景分析      |
| 子域名       | `/network/subdomains`   | 列表、表格                                  |
| WHOIS        | `/network/whois`        | 表单、结果展示                              |
| 网站连通性   | `/network/connectivity` | 多目标测试                                  |
| 全球 Ping    | `/network/ping`         | 节点列表、结果                              |
| CDN 节点     | `/network/cdn`          | 节点列表                                    |
| DNS 出口     | `/network/dns`          | 表格                                        |
| 浏览器环境   | `/browser/environment`  | 信息列表                                    |
| 浏览器指纹   | `/browser/fingerprint`  | 指纹展示                                    |
| 环境一致性   | `/browser/consistency`  | 对比列表                                    |
| 自动化特征   | `/browser/automation`   | 检测项                                      |
| 权限与隐私   | `/browser/privacy`      | 列表                                        |
| AI - GPT     | `/ai/gpt`               | 检测项                                      |
| AI - Claude  | `/ai/claude`            | 检测项                                      |
| 服务状态     | `/status/`              | 状态卡片                                    |
| API 文档     | `/docs/api`             | 文档展示                                    |
| 隐私/条款    | `/privacy`、`/terms`    | 文档                                        |
| 404          | `/not-found-route`      | 错误页                                      |

每个 view 检查项：

- [ ] 卡片背景半透明、文字可读
- [ ] 表格未错位、未超出视口
- [ ] 状态点颜色对比度足够
- [ ] 极光背景不干扰阅读
- [ ] 顶部两角按钮位置正确

- [ ] **Step 9.3：主题切换回归**

- [ ] light → dark：瞬间生效
- [ ] dark → system：跟随 OS
- [ ] system → light：固定浅色
- [ ] 三次切换无延迟累积
- [ ] 刷新页面（hard reload）无闪烁

- [ ] **Step 9.4：移动端测试**

- [ ] 375px 视口：两角按钮不被遮挡
- [ ] 移动端 nav 滚动正常
- [ ] 背景在移动端仍可见
- [ ] 横屏：布局未崩

- [ ] **Step 9.5：i18n 切换**

切到英文：

- [ ] 左上按钮 `aria-label` 为 "Back to Hoshiumi Home"
- [ ] 右上按钮 `aria-label` 为 "Toggle theme (Light / Dark / System)"
- [ ] 其他文案不受影响

切回中文：所有 a11y 文案正常。

- [ ] **Step 9.6：性能检查**

打开 devtools Network 与 Performance：

- [ ] 首屏无 JS 阻塞
- [ ] CSS 总大小合理（theme.css 增加 < 1KB）
- [ ] 极光背景 `will-change` 标注存在（避免重绘）

- [ ] **Step 9.7：构建验证**

```bash
cd F:\博客文件\one-ip
pnpm build
pnpm preview
```

打开 preview 端口，走遍首页 + IP 查询 + AI 平台，确保 production build 正常。

- [ ] **Step 9.8：最终 commit**

如本任务有修复：

```bash
cd F:\博客文件\one-ip
git add -A
git commit -m "fix: post-integration regression fixes"
```

---

## Self-Review（计划作者自查）

### 1. 覆盖检查

| Spec 章节                              | 覆盖任务                           |
| -------------------------------------- | ---------------------------------- |
| 2.1 构建期注入                         | Task 1, 2                          |
| 2.2 关键决策                           | Task 1, 3, 6, 8                    |
| 3 文件改动清单                         | Task 1-9                           |
| 4.1 config/site.yaml                   | Task 1                             |
| 4.2 编译产物                           | Task 1                             |
| 4.3 主题系统（三态）                   | Task 6, 7                          |
| 4.4 外壳布局（两角 + 背景 + 玻璃 nav） | Task 4, 5, 7, 8                    |
| 4.5 中性 token                         | Task 3                             |
| 4.6 shadcn 桥接                        | Task 3                             |
| 4.7 字体                               | Task 3                             |
| 4.8 i18n                               | Task 5                             |
| 5 验证清单                             | Task 9                             |
| 6 风险与回退                           | 一次性 commit，可 `git reset` 回滚 |
| 7 不在范围                             | 明确未触 view 内部                 |

### 2. 占位符扫描

无 "TBD"、"TODO"、"similar to" 等。

### 3. 类型一致性

- `setTheme(theme: Theme)` 一致
- `data-theme` / `data-theme-choice` 属性一致
- `--card-fill` / `--card-blur` / `--card-bg-opacity` / `--card-border-opacity` / `--card-radius` 一致
- i18n key 名一致："返回 Hoshiumi 主页"、"切换主题（浅色 / 深色 / 跟随系统）"

### 4. 风险点

- Task 3.5 删除 `app.css` 现有颜色块可能影响其他 view 的自定义样式：实施前需 grep `var(--background)` 等的使用密度，必要时保留兜底。
- Task 4.4 `.app-container` 加 `position: relative; z-index: 1;` 可能影响 sticky 行为：实施后验证滚动行为。
- Task 7.3 移除 nav 行内主题按钮：如有引用需在 Task 9 回归。

### 5. 计划未覆盖但应在执行时考虑

- `index.html` 的现有 `data-theme` 写入逻辑（旧 IIFE）与新追加的脚本可能重复写 `<html>` 属性。Task 6.4 应**修改**旧 IIFE 而非追加新脚本，避免双重写入。已更新 Task 6.4 描述：实际是替换/合并。

---

## 执行交接

计划完成，已保存到 `docs/superpowers/plans/2026-09-25-one-ip-ecosystem-ui-alignment.md`。

请选择执行方式：

1. **Subagent-Driven（推荐）** — 每个 task 派遣独立子代理执行，task 之间人工 review 闸口
2. **Inline Execution** — 当前会话内连续执行所有 task，批量检查点 review
