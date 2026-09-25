import { lazy, Suspense, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BackLink } from "@/components/back-link";
import { BuildInfo } from "@/components/build-info";
import { HomePageSkeleton } from "@/components/home-page-skeleton";
import { NavGroupDropdown } from "@/components/nav-group-dropdown";
import { AppUpdateChecker } from "@/components/providers/app-update-checker";
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";
import { Pending } from "@/components/toolkit";
import { UnderlineHover } from "@/components/underline-hover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { RouteErrorBoundary } from "./route-error-boundary";
import { activeNavigationRoute, toolGroups } from "./routes";

const MobileNavGlass = lazy(() => import("@/components/mobile-nav-glass"));

function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

function isGroupActive(
  group: "network" | "browser" | "ai",
  normalizedPath: string,
): boolean {
  if (normalizedPath === `/${group}`) return true;
  return toolGroups[group].some((tool) => tool.path === normalizedPath);
}

function generateStars(
  count: number,
): Array<{ top: number; left: number; size: "sm" | "lg" }> {
  // Deterministic pseudo-random for stable star positions across renders
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
  }));
}

const STARS = generateStars(30);

export function AppLayout() {
  const { resolvedTheme } = useTheme();
  const mobile = useIsMobile();
  const { pathname } = useLocation();
  const normalizedPath = normalizePath(pathname);
  const activeRoute = activeNavigationRoute(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <BgScene />
      <BackLink />
      <ThemeToggleButton />
      <div className="app-container">
        <nav className="app-nav" aria-label={t("主导航")}>
          {mobile && (
            <Suspense fallback={null}>
              <MobileNavGlass light={resolvedTheme === "light"} />
            </Suspense>
          )}
          <div className="app-nav__items">
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
              isActive={isGroupActive("ai", normalizedPath)}
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
              isActive={isGroupActive("network", normalizedPath)}
            />
            <NavGroupDropdown
              label={t("浏览器检测")}
              overviewPath="/browser"
              tools={toolGroups.browser}
              isActive={isGroupActive("browser", normalizedPath)}
            />
          </div>
        </nav>
        <main className="outline-none">
          <RouteErrorBoundary key={activeRoute}>
            <Suspense
              fallback={
                activeRoute === "/" ? (
                  <HomePageSkeleton />
                ) : (
                  <p className="status-line">
                    <Pending>{t("正在加载页面…")}</Pending>
                  </p>
                )
              }
            >
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </main>
        <footer className="app-footer">
          © {new Date().getFullYear()} IP ·{" "}
          <UnderlineHover asChild>
            <a
              href="https://huzhihui.com/blog/one-ip-guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("使用文档")}
            </a>
          </UnderlineHover>{" "}
          ·{" "}
          <UnderlineHover asChild>
            <Link to="/docs/api">API</Link>
          </UnderlineHover>{" "}
          ·{" "}
          <UnderlineHover asChild>
            <Link to="/terms">{t("使用条款")}</Link>
          </UnderlineHover>{" "}
          ·{" "}
          <UnderlineHover asChild>
            <Link to="/privacy">{t("隐私政策")}</Link>
          </UnderlineHover>{" "}
          ·{" "}
          <UnderlineHover asChild>
            <a
              href="https://github.com/zhihui-hu/one-ip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 align-middle"
            >
              GitHub
            </a>
          </UnderlineHover>{" "}
          ·{" "}
          <UnderlineHover asChild>
            <a href="mailto:ip@huzhihui.com">{t("联系作者")}</a>
          </UnderlineHover>
        </footer>
      </div>
      <aside aria-label={t("站点通知")} className="update-notices">
        <AppUpdateChecker />
      </aside>
      <BuildInfo />
      <Toaster richColors theme={resolvedTheme} position="top-right" />
    </>
  );
}

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
