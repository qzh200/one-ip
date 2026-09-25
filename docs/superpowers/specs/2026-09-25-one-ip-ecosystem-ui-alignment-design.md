# One-IP 与 Hoshiumi 生态 UI 对齐 — 设计文档

- **日期**：2026-09-25
- **项目**：one-ip（IP 网络诊断工具 SPA）
- **目标**：将 one-ip 的外壳、主题系统、导航、背景、配色改造到与 hoshiumi_home / hoshiumi_drive / hoshiumi_stats 同一画风
- **范围**：仅外壳层 + 主题系统 + 配色 token；view 内部组件（IP 卡片、Ping 网格、表格、状态色块等）一行不改

---

## 1. 背景与目标

### 1.1 现状

one-ip 当前是 React 19 + Vite + Tailwind 4 + shadcn/ui 的 SPA，提供 10+ 网络诊断工具。UI 风格与 hoshiumi_* 系列（hoshiumi_home / hoshiumi_drive / hoshiumi_stats）有明显差距：

| 维度             | one-ip 现状                        | 生态现状                                             |
| ---------------- | ---------------------------------- | ---------------------------------------------------- |
| 左上返回按钮     | 无                                 | `.back-link` 圆形玻璃 → hoshiumi.xyz/                |
| 右上主题切换     | 2 态（light/dark），位于导航行内   | 3 态（light/dark/system），fixed 右上圆形玻璃        |
| 配色             | shadcn oklch 蓝 (`#1976d2` 主题色) | `#7f9df2` 蓝紫 / `#f0a9cc` 樱花粉 / `#9d92ec` 星雾紫 |
| 卡片             | 纯白/深灰实色                      | 毛玻璃 22px 圆角 + 20px blur                         |
| 背景             | 无                                 | 极光三光斑动画 + 星点 + 噪点                         |
| 主题变量         | `.dark` class                      | `data-theme="light\|dark"` + `data-theme-choice`     |
| localStorage key | `theme`                            | 每站独立（`one-ip-theme` 风格）                      |

### 1.2 目标

- 让 one-ip 在视觉上成为 hoshiumi 生态的"第四个站"
- 提供 `config/site.yaml` 让未来改色不必动 TS 代码
- 主题切换、外壳布局、背景氛围三件套对齐生态
- 不破坏现有任何 view 的业务功能

### 1.3 非目标（明确排除）

- 不重做各 view 内部组件
- 不引入新运行时依赖（`yaml` 与 `zod` 已在 package.json）
- 不修改生产部署脚本
- 不引入动画主题切换（与生态对齐采用瞬时切换）

---

## 2. 架构

### 2.1 总体方向

采用与 hoshiumi_drive 完全同构的构建期注入方案：

```
config/site.yaml
   │
   │  scripts/build-theme.mjs（predev/prebuild/prepreview 触发）
   ▼
src/generated/theme.css   ← :root[data-theme=light/dark] 的 CSS 变量
   │
   │  Vite CSS 流水线
   ▼
打包到最终 bundle
```

- 运行时无 YAML 解析，0 额外依赖
- Vite 配置 `buildStart` 钩子监听 `config/site.yaml` 变化，dev 时自动重跑
- 验证 YAML 结构由 `config/schema.ts`（Zod）在 build 阶段执行，错误立即报告

### 2.2 关键设计决策

1. **构建期注入**：避免运行时 YAML 解析，与 hoshiumi_drive 的 `config:build` 同构
2. **shadcn 兼容桥接**：保留 shadcn 的 `--background`/`--card`/`--border` 等变量名，通过 `@theme inline` 把生态 `--color-bg`/`--color-primary` 桥接到 `--background`/`--primary`，所有 view 组件无需改一行代码
3. **双主题属性并存**：`data-theme` + `data-theme-choice`（生态风格）+ 同步写 `.dark` class（保留 shadcn `dark:` 工具类）
4. **三态切换瞬时**：删除现有 `startViewTransition` 圆形波纹，与生态点击即变对齐
5. **背景极光轻量化**：保留渐变氛围 + 噪点 + 静态星点，不引入动画光斑，避免对工具可读性造成干扰

---

## 3. 文件改动清单

### 3.1 新增

| 文件                      | 用途                                      |
| ------------------------- | ----------------------------------------- |
| `config/site.yaml`        | 主配置：home URL、主题色、卡片参数        |
| `config/schema.ts`        | Zod 校验（与 hoshiumi_drive schema 对齐） |
| `scripts/build-theme.mjs` | 读 YAML → 生成 `src/generated/theme.css`  |
| `src/generated/theme.css` | 编译产物（git 忽略）                      |

### 3.2 修改

| 文件                                           | 改动                                                                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                 | `predev`/`prebuild`/`prepreview` 加 `node scripts/build-theme.mjs`                                                               |
| `vite.config.ts`                               | 加 buildStart/watch 钩子监听 `config/site.yaml` 变化重跑脚本                                                                     |
| `index.html`                                   | 在现有 IIFE 后追加 FOUC 内联引导脚本（保留 IE 守卫、embedded-browser 守卫）                                                      |
| `src/index.css`                                | 删除 `::view-transition-*` 相关规则（不再使用）；删除 `@fontsource-variable/geist` import；删除 Geist 字体声明                   |
| `src/app.css`                                  | 注入生态中性 token、极光背景类、`.back-link`、`.theme-toggle`、`.bg-scene`、**生态字体栈**；保留所有现有 `.app-container` 等规则 |
| `src/layout/index.tsx`                         | 改写 `AppLayout`：渲染 `BackLink`、`ThemeToggleButton` 移至 fixed；`app-nav` 改玻璃样式；移除移动端行内主题按钮                  |
| `src/components/theme/theme-toggle-button.tsx` | 简化：删除 view-transition 代码、三态图标、fixed 容器样式；aria-label 通过 i18n                                                  |
| `src/components/providers/theme-provider.tsx`  | 简化为只设置 `data-theme`/`data-theme-choice` + `.dark` class 同步                                                               |
| `src/hooks/use-theme.ts`                       | 移除 view-transition 相关逻辑；新增 `window.oneIpTheme` 暴露                                                                     |
| `src/store/theme.ts`                           | 移除 `themeTransitionPendingAtom`，主 atom 仍保留                                                                                |
| `src/i18n/zh.json`、`src/i18n/en.json`         | 新增"返回 Hoshiumi 主页"、"切换主题（浅色 / 深色 / 跟随系统）"两把钥匙（中英两版）                                               |

### 3.3 不动（关键约束）

- 所有 `src/views/**` 内部组件 — 一行不改
- 所有 `src/components/ui/**`（shadcn 组件）— 一行不改
- `src/components/{connectivity,country-flag,site-logo,toolkit,...}.tsx` — 一行不改
- `src/i18n/index.ts`、`src/lib/**` — 不改
- `src/views/home/sources.json`、`src/views/ping/nodes.json` 等数据文件 — 不改
- `wrangler.toml`、`scripts/worker-dev.mjs` 等部署脚本 — 不改

---

## 4. 详细设计

### 4.1 config/site.yaml 结构

```yaml
site:
  title: IP 网络工具
  home_url: https://hoshiumi.xyz/ # 左上返回按钮目标
  theme:
    default: system # light | dark | system
    allow_switch: true

theme: # 注入到 :root[data-theme='light']
  background: "#f4f6fe"
  primary: "#7f9df2" # 与 hoshiumi_drive 完全一致
  secondary: "#f0a9cc"
  accent: "#9d92ec"

dark: # 注入到 :root[data-theme='dark']
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

### 4.2 编译产物示例（src/generated/theme.css）

```css
:root,
:root[data-theme="light"] {
  --color-bg: #f4f6fe;
  --color-primary: #7f9df2;
  --color-secondary: #f0a9cc;
  --color-accent: #9d92ec;
  --card-radius: 22px;
  --card-blur: 20px;
  --card-border-opacity: 0.35;
  --card-bg-opacity: 0.6;
}

:root[data-theme="dark"] {
  --color-bg: #0e1230;
  --color-primary: #9ab2ff;
  --color-secondary: #ffb8d6;
  --color-accent: #b6acff;
}
```

### 4.3 主题系统（三态）

**状态机**：`light → dark → system → light` 循环切换

**FOUC 防护**：在 `index.html` `<head>` 顶部加内联 ES5 脚本

- 读 `localStorage.one-ip-theme`
- 兼容旧 `localStorage.theme`（一次性迁移）
- 计算 effective（system 时跟 `prefers-color-scheme`）
- 设 `<html data-theme data-theme-choice>`

**主题按钮**

- 三态图标：`Sun` / `Moon` / `Monitor`（lucide-react 都有）
- 用 `data-theme-choice` 决定哪个图标 `display:block`，与生态 `.theme-toggle__icon--{choice}` 同构
- fixed 定位 `top: max(18px, env(safe-area-inset-top)); right: max(18px, env(safe-area-inset-right))`

**对外 API**

- `window.oneIpTheme = { get(), set() }`，与 `window.driveTheme` 同构

**dark class 同步**

- `useTheme().setTheme(next)` 同步设：
  - `document.documentElement.dataset.theme = effective`
  - `document.documentElement.dataset.themeChoice = choice`
  - `document.documentElement.classList.toggle('dark', resolved === 'dark')`（保留 shadcn `dark:` 工具类）
  - `document.documentElement.style.colorScheme = resolved`

### 4.4 外壳布局

**顶部两角（fixed，z-60）**

```tsx
// 左上返回按钮
<a
  class="back-link"
  href={config.site.home_url}
  aria-label="返回 Hoshiumi 主页"
  title="返回 Hoshiumi 主页"
>
  <svg viewBox="0 0 24 24" ... >  {/* ArrowLeft */}
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
</a>

// 右上主题切换按钮
<button class="theme-toggle" data-theme-toggle ...>
  <Sun /> <Moon /> <Monitor />  {/* 由 data-theme-choice 控制 display */}
</button>
```

CSS（与生态完全镜像）：

```css
.back-link,
.theme-toggle {
  position: fixed;
  top: max(18px, env(safe-area-inset-top));
  z-index: 60;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgb(var(--line) / var(--card-border-opacity, 0.4));
  background: var(--card-fill);
  color: var(--ink-soft);
  backdrop-filter: blur(var(--card-blur, 18px));
  transition:
    transform 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
}
.back-link {
  left: max(18px, env(safe-area-inset-left));
}
.theme-toggle {
  right: max(18px, env(safe-area-inset-right));
}
.back-link:hover,
.theme-toggle:hover {
  transform: translateY(-2px);
  color: var(--color-primary);
  border-color: rgb(var(--line) / 0.7);
}
```

**导航行（桌面端）**

- 保留原结构：logo + tabs 滚动 + 分享/语言
- 容器改毛玻璃：`bg: var(--card-fill); backdrop-filter: blur(20px); border-radius: 22px; border: 1px solid rgb(var(--line) / 0.35)`
- 主题按钮从此处移除（已 fixed 右上）

**极光背景（fixed，z-0）**

- 三层堆叠（无动画光斑）：
  1. 渐变氛围 `linear-gradient(172deg, color-mix(primary, 9%, transparent), transparent, transparent, color-mix(secondary, 8%, transparent))`
  2. 约 30 颗 `star--sm` 静态分布
  3. 噪点 SVG（与生态同 base64 data URI）
- 颜色全部取自 `--color-primary/secondary/accent`，自动跟主题切换
- 暗色模式光强度通过 `--orb-opacity: 0.36` 降低（写死在 app.css）

### 4.5 设计令牌（中性 token，写死在 app.css）

```css
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

### 4.6 shadcn 兼容桥接

one-ip 现存 shadcn 大量使用 `var(--background)` / `var(--card)` / `var(--border)` / `var(--primary)` / `var(--muted-foreground)` 等命名。采用**直接桥接**策略：把生态的 `--color-bg` / `--color-primary` 等映射到 shadcn 同名变量。这样 shadcn 组件 `bg-card text-muted-foreground border-border` 等 utility 不需要任何代码改动就能生效。

由于 shadcn 变量已有默认值（来自 `index.css` 的 `:root` 与 `.dark`），改造方式为：

1. **删除** `app.css` 中现有的硬编码颜色块（`--background: #fafafa` 等）—— 因为它覆盖了生态注入的桥接
2. **在 `app.css` 中新增桥接层**（紧跟生态中性 token 之后）：

```css
/* 生态 → shadcn 变量桥接，shadcn 组件无需修改 */
:root,
:root[data-theme="light"] {
  --background: var(--color-bg);
  --foreground: var(--ink);
  --card: var(--card-fill);
  --card-foreground: var(--ink);
  --popover: var(--card-fill);
  --popover-foreground: var(--ink);
  --primary: var(--color-primary);
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
}

:root[data-theme="dark"] {
  --background: var(--color-bg);
  --foreground: var(--ink);
  --card: var(--card-fill);
  --card-foreground: var(--ink);
  --popover: var(--card-fill);
  --popover-foreground: var(--ink);
  --primary: var(--color-primary);
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
}
```

3. **保留** one-ip 自有的状态语义色：`--success / --success-soft / --success-text / --warning / --danger / --good / --info-soft / --info-text`（这些是 view 内部组件使用的语义色，与生态色调无冲突）

4. **保留** `@custom-variant dark (&:is(.dark *));` —— shadcn 的 `dark:` utility 仍可工作（我们已在 `setTheme` 中同步写 `.dark` class）

### 4.7 字体

**完全采用生态字体栈**，不再使用 Geist Variable：

```css
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
```

对应改动：

- 删除 `src/index.css` 中的 `@import "@fontsource-variable/geist";`
- 删除 `@theme inline` 中的 `--font-sans` / `--font-heading` 自定义声明
- 可选：从 `package.json` 移除 `@fontsource-variable/geist` 依赖（如果其他地方没有用到）

### 4.8 文案策略

**沿用 one-ip 既有的 i18n 系统**（项目本就 `react-i18n` 化），本次新增文案全部走 i18n 键，与现有代码风格保持一致。

新增 i18n 键：

| key                                  | zh-CN                              | en                                   |
| ------------------------------------ | ---------------------------------- | ------------------------------------ |
| `返回 Hoshiumi 主页`                 | 返回 Hoshiumi 主页                 | Back to Hoshiumi Home                |
| `切换主题（浅色 / 深色 / 跟随系统）` | 切换主题（浅色 / 深色 / 跟随系统） | Toggle theme (Light / Dark / System) |

使用方式：

- `BackLink`：`aria-label={t("返回 Hoshiumi 主页")}`、`title={t("返回 Hoshiumi 主页")}`
- `ThemeToggleButton`：`aria-label={t("切换主题（浅色 / 深色 / 跟随系统）")}`

现有 `t("切换为浅色模式")` / `t("切换为深色模式")` 两把 i18n 键可保留作为子状态描述，但按钮整体 `aria-label` 替换为三态统一文案。

---

## 5. 验证清单

### 5.1 自动化验证

1. `pnpm dev` 自动跑 `build-theme.mjs`，控制台无报错
2. `pnpm build` 产物包含 `theme.css`，无 YAML/YAML 解析痕迹
3. `pnpm preview` 跑过，prod 模式无错
4. 改 `config/site.yaml` 中 `theme.primary` 后 dev 自动热更
5. `build-theme.mjs` 单测：合法/非法 YAML 各一个 fixture

### 5.2 手动验证（每个一项）

1. 三态切换 light → dark → system → light，每次 < 50ms，刷新页面无闪烁
2. hard reload（Cmd+Shift+R）暗色用户看不到白屏
3. 375px 移动端：返回按钮、主题按钮不被遮挡（验证 `env(safe-area-inset-*)`）
4. 走遍 10+ view：IP 详情、AI 平台、CDN、Ping、Whois、浏览器指纹、人机挑战
   - 卡片可读
   - 表格未错位
   - 状态点颜色对比度未塌
   - 无元素被极光背景遮盖
5. 移动端横屏/竖屏、tab 切换、modal 弹出
6. i18n 中英文切换正常

### 5.3 回归测试

- 现存 `tests/*.test.mjs` 全部通过
- 旧 `localStorage.theme` 用户兼容（一次性迁移到 `one-ip-theme`）

---

## 6. 风险与回退

### 6.1 已识别风险

| 风险                                    | 概率 | 缓解                                             |
| --------------------------------------- | ---- | ------------------------------------------------ |
| shadcn 变量桥接不完整导致某些组件颜色错 | 中   | 在 `@theme inline` 完整覆盖；逐组件抽检          |
| 极光背景干扰密集表格阅读                | 低   | 已选极光轻量；如有反馈可加 `bg-white/95` 覆盖层  |
| 旧 localStorage 用户首次切换丢偏好      | 低   | 内置一次性迁移逻辑（优先读新 key，回退到旧 key） |
| 移动端 safe-area 在某些浏览器失效       | 低   | 同时设 `max(18px, env(safe-area-inset-top))`     |
| `data-theme` 与 `.dark` 状态不一致      | 中   | 在 `useTheme` 中保证原子同步                     |

### 6.2 回退预案

- 所有改动一次 commit，不推送
- 验证失败 `git reset --hard HEAD~1` 一键回滚
- 不修改远程部署，本次只在本地验证完成后再推

---

## 7. 不在范围（明确）

- 不重做各 view 内部组件视觉风格
- 不引入新依赖（`yaml`/`zod` 已在 package.json）
- 不修改 `wrangler.toml`、`scripts/worker-dev.mjs`
- 不改生产部署流程
- 不引入新的动画主题切换

---

## 8. 参考

- `hoshiumi_drive/src/styles/global.css` — 生态全局样式
- `hoshiumi_drive/src/components/BackLink.astro` — 返回按钮参考
- `hoshiumi_drive/src/components/ThemeToggle.astro` — 主题按钮参考
- `hoshiumi_drive/scripts/` — `config:build` 实现参考
- `hoshiumi_drive/src/config/schema.ts` — Zod 校验参考
- `one-ip/src/components/theme/theme-toggle-button.tsx` — 当前实现（要被改造）
- `one-ip/src/views/home/index.tsx` — 首页（保持不变）
