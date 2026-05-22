import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";
import { AppIcon, type AppIconName } from "@/components/app-shell/app-icons";

export function MetricIconBadge({
  tone,
  icon,
  size = "md",
}: {
  tone: DashboardMetricTone;
  icon: AppIconName;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-7 w-7 text-[0.8rem]"
      : size === "lg"
        ? "h-12 w-12 text-[1.15rem]"
        : "h-9 w-9 text-[0.95rem]";

  return (
    <span
      className={`dashboard-icon-badge ${sizeClass}`.trim()}
      style={dashboardToneVars(tone)}
      aria-hidden="true"
    >
      <AppIcon name={icon} />
    </span>
  );
}
