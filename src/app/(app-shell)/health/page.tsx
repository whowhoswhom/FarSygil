import {
  DashboardHealthClusterCard,
  MetricIconBadge,
} from "@/components/visual-reboot";
import { AppleHealthImportPanel } from "@/components/health/apple-health-import-panel";
import { db } from "@/db/client";
import {
  getAppleHealthImportSummary,
  getLatestAppleHealthMetrics,
  type AppleHealthMetricSnapshot,
} from "@/server/apple-health/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEALTH_METRIC_DEFINITIONS = [
  {
    metricType: "vo2_max",
    label: "VO2 Max",
    tone: "time" as const,
    icon: "spark" as const,
    digits: 1,
  },
  {
    metricType: "resting_hr",
    label: "Resting HR",
    tone: "cardio" as const,
    icon: "heartrate" as const,
    digits: 0,
  },
  {
    metricType: "hrv",
    label: "HRV",
    tone: "recovery" as const,
    icon: "spark" as const,
    digits: 0,
  },
  {
    metricType: "sleep_hours",
    label: "Sleep",
    tone: "recovery" as const,
    icon: "recovery" as const,
    digits: 1,
  },
  {
    metricType: "steps",
    label: "Steps",
    tone: "distance" as const,
    icon: "runs" as const,
    digits: 0,
  },
];

export default async function HealthPage() {
  const [summary, latestMetrics] = await Promise.all([
    getAppleHealthImportSummary(db),
    getLatestAppleHealthMetrics(
      db,
      HEALTH_METRIC_DEFINITIONS.map((metric) => metric.metricType),
    ),
  ]);
  const latestMetricsByType = new Map(
    latestMetrics.map((metric) => [metric.metricType, metric]),
  );

  return (
    <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
      <section className="px-1 pt-1">
        <p className="section-kicker mb-3">Health</p>
        <h1 className="text-[2.9rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
          Health
        </h1>
      </section>

      <section className="dashboard-shell-card p-6 md:p-7">
        <div className="relative flex items-center gap-4">
          <MetricIconBadge tone="recovery" icon="health" size="lg" />
          <div>
            <h2 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
              Apple Health
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
              Daily health metrics render only after a local Apple Health export
              has been imported into SQLite.
            </p>
          </div>
        </div>
      </section>

      <AppleHealthImportPanel
        metricRows={summary.metricRows}
        latestMetricDate={summary.latestMetricDate}
        latestImport={summary.latestImport}
        latestLog={summary.latestLog}
      />

      <DashboardHealthClusterCard
        title="Health & Wellness"
        sourceLabel="Apple Health"
        metrics={HEALTH_METRIC_DEFINITIONS.map((definition) => {
          const metric = latestMetricsByType.get(definition.metricType);

          return {
            label: definition.label,
            tone: definition.tone,
            icon: definition.icon,
            value: metric ? formatMetricValue(metric, definition.digits) : undefined,
            unit: metric?.unit ?? undefined,
          };
        })}
        hint={
          summary.metricRows > 0
            ? `Latest local Apple Health metric date: ${summary.latestMetricDate ?? "--"}.`
            : "Data not available until the Apple Health importer parses real exports and stores daily metric rows locally."
        }
      />
    </main>
  );
}

function formatMetricValue(
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
