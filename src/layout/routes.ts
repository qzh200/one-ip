import { t } from "@/i18n";
import { aiPlatforms } from "@/views/ai/platforms";

export const navigationRoutes = [
  { value: "/", label: t("首页"), short: t("首页") },
  { value: "/ai/", label: t("AI 检测"), short: "AI" },
  { value: "/status/", label: t("服务状态"), short: t("状态") },
  { value: "/network/", label: t("网络检测"), short: t("网络") },
  { value: "/browser/", label: t("浏览器检测"), short: t("浏览器") },
] as const;
export const toolGroups = {
  network: [
    { path: "/network/connectivity", label: t("网站连通与出口") },
    { path: "/network/dns", label: t("DNS 出口") },
    { path: "/network/cdn", label: t("CDN 节点") },
    { path: "/network/ip", label: t("IP 检测") },
    { path: "/network/subdomains", label: t("子域名查询") },
    { path: "/network/whois", label: "WHOIS" },
    { path: "/network/ping", label: t("全球 Ping") },
  ],
  browser: [
    { path: "/browser/environment", label: t("环境信息") },
    { path: "/browser/fingerprint", label: t("指纹检测") },
    { path: "/browser/consistency", label: t("环境一致性") },
    { path: "/browser/automation", label: t("自动化特征") },
    { path: "/browser/privacy", label: t("权限与隐私") },
    { path: "/browser/challenges", label: t("人机校验") },
  ],
  ai: aiPlatforms.map((platform) => ({
    path: `/ai/${platform.id}`,
    label: platform.name,
  })),
  status: [
    { path: "/status", label: t("全部") },
    { path: "/status?group=AI", label: "AI" },
    { path: "/status?group=VPS", label: "VPS" },
    { path: "/status?group=云服务", label: t("云服务") },
    { path: "/status?group=开发", label: t("开发") },
    { path: "/status?group=社区", label: t("社区") },
  ],
} as const;
export const legacyRoutes: Record<string, string> = {
  "/query": "/network/ip",
  "/query/ip": "/network/ip",
  "/query/ip/:ip": "/network/ip",
  "/query/whois": "/network/whois",
  "/ip": "/network/ip",
  "/ip/:ip": "/network/ip",
  "/whois": "/network/whois",
  "/link": "/network/connectivity",
  "/network/link": "/network/connectivity",
  "/network/exits": "/network/connectivity",
  "/ping": "/network/ping",
  "/cdn": "/network/cdn",
  "/dns-exit": "/network/dns",
  "/network/dns-exit": "/network/dns",
  "/webrtc": "/browser/privacy",
  "/network/webrtc": "/browser/privacy",
  "/browser/webrtc": "/browser/privacy",
  "/gpt": "/ai/gpt",
  "/claude": "/ai/claude",
  "/gpt/status.html": "/status/openai",
  "/claude/status.html": "/status/claude",
  "/ai/gpt/status": "/status/openai",
  "/ai/claude/status": "/status/claude",
};
export function activeNavigationRoute(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "/";
  for (const [group, routes] of Object.entries(toolGroups)) {
    if (path === `/${group}` || routes.some((route) => route.path === path))
      return `/${group}/`;
  }
  if (/^\/network\/ip\/[^/]+$/.test(path)) return "/network/";
  return /^\/status(?:\/(?:openai|claude))?$/.test(path)
    ? "/status/"
    : "not-found";
}

export function visibleTools(
  group: keyof typeof toolGroups,
  challengesConfigured: boolean,
) {
  if (group === "status") return toolGroups.status;
  return toolGroups[group].filter(
    (tool) => tool.path !== "/browser/challenges" || challengesConfigured,
  );
}
