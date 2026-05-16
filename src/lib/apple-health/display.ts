import type { AppIconName } from "@/components/app-shell/app-icons";
import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import type { AppleHealthMetricSnapshot } from "@/server/apple-health/queries";

export interface AppleHealthDisplayMetricDefinition {
  metricType: string;
  label: string;
  tone: DashboardMetricTone;
  icon: AppIconName;
  digits: number;
}

export const APPLE_HEALTH_DASHBOARD_METRICS: AppleHealthDisplayMetricDefinition[] =
  [
    {
      metricType: "vo2_max",
      label: "VO₂ Max",
      tone: "time",
      icon: "spark",
      digits: 1,
    },
    {
      metricType: "resting_hr",
      label: "Resting HR",
      tone: "cardio",
      icon: "heartrate",
      digits: 0,
    },
    {
      metricType: "hrv",
      label: "HRV",
      tone: "recovery",
      icon: "spark",
      digits: 0,
    },
    {
      metricType: "sleep_hours",
      label: "Sleep",
      tone: "recovery",
      icon: "recovery",
      digits: 1,
    },
    {
      metricType: "steps",
      label: "Steps",
      tone: "distance",
      icon: "runs",
      digits: 0,
    },
  ];

export function getAppleHealthDashboardMetricTypes(): string[] {
  return APPLE_HEALTH_DASHBOARD_METRICS.map((metric) => metric.metricType);
}

export function buildAppleHealthDashboardMetrics(
  latestMetrics: AppleHealthMetricSnapshot[],
): Array<{
  label: string;
  tone: DashboardMetricTone;
  icon: AppIconName;
  value?: string;
  unit?: string;
}> {
  const latestMetricsByType = new Map(
    latestMetrics.map((metric) => [metric.metricType, metric]),
  );

  return APPLE_HEALTH_DASHBOARD_METRICS.map((definition) => {
    const metric = latestMetricsByType.get(definition.metricType);
    const value = metric
      ? formatAppleHealthMetricValue(metric, definition.digits)
      : undefined;

    return {
      label: definition.label,
      tone: definition.tone,
      icon: definition.icon,
      value,
      unit: value && value !== "--" ? metric?.unit ?? undefined : undefined,
    };
  });
}

export function formatAppleHealthMetricValue(
  metric: AppleHealthMetricSnapshot,
  digits: number,
): string {
  if (typeof metric.value !== "number" || !Number.isFinite(metric.value)) {
    return "--";
  }

  return metric.value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}
