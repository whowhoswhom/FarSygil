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
      ? "h-10 w-10 text-[1rem]"
      : size === "lg"
        ? "h-14 w-14 text-[1.3rem]"
        : "h-12 w-12 text-[1.1rem]";

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
