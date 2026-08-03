import type { AppIconName } from "@/components/app-shell/app-icons";
import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import type {
  AppleHealthMetricSnapshot,
  AppleHealthMetricTrendSeries,
} from "@/server/apple-health/queries";

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

// Explicit `/health` clustering. These sets — not array-index slices — decide
// which metrics render under Vitals vs Daily Signals, so reordering
// APPLE_HEALTH_DASHBOARD_METRICS can never silently re-bucket a metric.
export const APPLE_HEALTH_VITALS_METRIC_TYPES = [
  "vo2_max",
  "resting_hr",
  "hrv",
] as const;

export const APPLE_HEALTH_DAILY_SIGNAL_METRIC_TYPES = [
  "sleep_hours",
  "steps",
] as const;

export interface AppleHealthDisplayMetric {
  label: string;
  tone: DashboardMetricTone;
  icon: AppIconName;
  value?: string;
  unit?: string;
  chartValues?: number[];
}

export function getAppleHealthDashboardMetricTypes(): string[] {
  return APPLE_HEALTH_DASHBOARD_METRICS.map((metric) => metric.metricType);
}

export function buildAppleHealthDashboardMetrics(
  latestMetrics: AppleHealthMetricSnapshot[],
  trendSeries: AppleHealthMetricTrendSeries[] = [],
): AppleHealthDisplayMetric[] {
  return buildAppleHealthMetricGroup(
    latestMetrics,
    trendSeries,
    getAppleHealthDashboardMetricTypes(),
  );
}

/**
 * Builds display metrics for an explicit set of metric types, preserving the
 * canonical `APPLE_HEALTH_DASHBOARD_METRICS` order. Unknown metric types are
 * ignored. This is the shared builder behind both the dashboard cluster (full
 * set) and the `/health` Vitals / Daily Signals clusters.
 */
export function buildAppleHealthMetricGroup(
  latestMetrics: AppleHealthMetricSnapshot[],
  trendSeries: AppleHealthMetricTrendSeries[],
  metricTypes: readonly string[],
): AppleHealthDisplayMetric[] {
  const latestMetricsByType = new Map(
    latestMetrics.map((metric) => [metric.metricType, metric]),
  );
  const trendSeriesByType = new Map(
    trendSeries.map((series) => [series.metricType, series]),
  );
  const requested = new Set(metricTypes);

  return APPLE_HEALTH_DASHBOARD_METRICS.filter((definition) =>
    requested.has(definition.metricType),
  ).map((definition) => {
    const metric = latestMetricsByType.get(definition.metricType);
    const trend = trendSeriesByType.get(definition.metricType);
    const value = metric
      ? formatAppleHealthMetricValue(metric, definition.digits)
      : undefined;
    const chartValues =
      trend && trend.points.length >= 2
        ? trend.points.map((point) => point.value)
        : undefined;

    const displayMetric: AppleHealthDisplayMetric = {
      label: definition.label,
      tone: definition.tone,
      icon: definition.icon,
      value,
      unit: value && value !== "--" ? metric?.unit ?? undefined : undefined,
    };

    return chartValues ? { ...displayMetric, chartValues } : displayMetric;
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
