import { lazy, Suspense, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BackLink } from "@/components/back-link";
import { BuildInfo } from "@/components/build-info";
import { HomePageSkeleton } from "@/components/home-page-skeleton";
import { AppUpdateChecker } from "@/components/providers/app-update-checker";
import { ThemeToggleButton } from "@/components/theme/theme-toggle-button";
import { Pending } from "@/components/toolkit";
import { AnimatedSegmentedTabs } from "@/components/ui/animated-segmented-tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UnderlineHover } from "@/components/underline-hover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { t } from "@/i18n";
import { Search, Globe, Cable, Activity, Sparkles } from "lucide-react";
import { Tabs } from "radix-ui";
import { Toaster } from "sonner";
import { RouteErrorBoundary } from "./route-error-boundary";
import { activeNavigationRoute, navigationRoutes } from "./routes";

const MobileNavGlass = lazy(() => import("@/components/mobile-nav-glass"));

const menuIcons = {
  "/": Search,
  "/browser/": Globe,
  "/network/": Cable,
  "/ai/": Sparkles,
  "/status/": Activity,
};

const options = navigationRoutes.map((route) => {
  const Icon = menuIcons[route.value];
  return {
    value: route.value,
    label: (
      <>
        <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        <span className="nav-full">{route.label}</span>
        <span className="nav-short">{route.short}</span>
      </>
    ),
  };
});

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
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const activeRoute = activeNavigationRoute(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    const viewport = navRef.current?.querySelector<HTMLElement>(
      "[data-slot=scroll-area-viewport]",
    );
    const trigger = navRef.current?.querySelector<HTMLElement>(
      "[role=tab][data-state=active]",
    );
    if (!viewport || !trigger) return;
    const parent = viewport.getBoundingClientRect();
    const child = trigger.getBoundingClientRect();
    const offset =
      child.left < parent.left
        ? child.left - parent.left - 8
        : child.right > parent.right
          ? child.right - parent.right + 8
          : 0;
    if (offset)
      viewport.scrollBy({
        left: offset,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }, [pathname]);

  return (
    <>
      <BgScene />
      <BackLink />
      <ThemeToggleButton />
      <div className="app-container">
        <AnimatedSegmentedTabs
          label={t("网络诊断工具")}
          options={options}
          value={activeRoute}
          onValueChange={(value) => {
            if (value !== activeRoute) navigate(value);
          }}
          activationMode="manual"
          className="min-w-0"
          listClassName="h-9 w-max justify-start gap-0.5 bg-transparent p-0"
          highlightClassName="rounded-lg bg-primary/10 shadow-none ring-0"
          triggerClassName="h-9 flex-none rounded-lg border-0 px-2 text-[13px] text-muted-foreground hover:bg-accent/50 data-[state=active]:font-semibold data-[state=active]:text-primary"
          renderList={(list) => (
            <nav ref={navRef} className="app-nav" aria-label={t("主导航")}>
              {mobile && (
                <Suspense fallback={null}>
                  <MobileNavGlass light={resolvedTheme === "light"} />
                </Suspense>
              )}
              <ScrollArea className="nav-tabs-scroll">
                {list}
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </nav>
          )}
        >
          <Tabs.Content value={activeRoute} asChild>
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
          </Tabs.Content>
        </AnimatedSegmentedTabs>
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
