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
