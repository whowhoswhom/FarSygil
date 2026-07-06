import { DashboardHealthClusterCard } from "@/components/visual-reboot";
import { AppleHealthImportPanel } from "@/components/health/apple-health-import-panel";
import { db } from "@/db/client";
import {
  APPLE_HEALTH_DAILY_SIGNAL_METRIC_TYPES,
  APPLE_HEALTH_VITALS_METRIC_TYPES,
  buildAppleHealthMetricGroup,
  getAppleHealthDashboardMetricTypes,
} from "@/lib/apple-health/display";
import {
  getAppleHealthImportSummary,
  getAppleHealthMetricTrendSeries,
  getLatestAppleHealthMetrics,
} from "@/server/apple-health/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const metricTypes = getAppleHealthDashboardMetricTypes();
  const [summary, latestMetrics, trendSeries] = await Promise.all([
    getAppleHealthImportSummary(db),
    getLatestAppleHealthMetrics(db, metricTypes),
    getAppleHealthMetricTrendSeries(db, metricTypes),
  ]);
  const vitalsMetrics = buildAppleHealthMetricGroup(
    latestMetrics,
    trendSeries,
    APPLE_HEALTH_VITALS_METRIC_TYPES,
  );
  const dailySignalMetrics = buildAppleHealthMetricGroup(
    latestMetrics,
    trendSeries,
    APPLE_HEALTH_DAILY_SIGNAL_METRIC_TYPES,
  );

  return (
    <main className="page-shell flex flex-col gap-4 pb-5 text-[var(--ink-1)]">
      <section className="grid items-end gap-4 px-1 pt-1 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)]">
        <div>
          <p className="section-kicker mb-2">Health & Wellness</p>
          <h1 className="text-[2.35rem] font-semibold tracking-[-0.07em] text-white md:text-[3.35rem]">
            Health
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)] md:text-base">
            Local Apple Health metrics only. Missing values stay empty until an
            export writes real rows into SQLite.
          </p>
        </div>

        <div className="dashboard-shell-card p-4">
          <p className="section-kicker mb-2">Local source</p>
          <div className="grid grid-cols-2 gap-3">
            <StatusCell label="Metric rows" value={summary.metricRows.toLocaleString()} />
            <StatusCell label="Latest metric" value={summary.latestMetricDate ?? "--"} />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="grid gap-4">
          <DashboardHealthClusterCard
            title="Vitals"
            sourceLabel="Apple Health"
            metrics={vitalsMetrics}
            hint={
              summary.metricRows > 0
                ? `Latest local Apple Health metric date: ${summary.latestMetricDate ?? "--"}.`
                : "Data not available until the Apple Health importer parses real exports and stores daily metric rows locally."
            }
          />

          <DashboardHealthClusterCard
            title="Daily Signals"
            sourceLabel="Apple Health"
            metrics={dailySignalMetrics}
            hint="Sleep and steps render only when real Apple Health rows exist locally; missing signals stay --."
          />
        </div>

        <AppleHealthImportPanel
          metricRows={summary.metricRows}
          latestMetricDate={summary.latestMetricDate}
          latestImport={summary.latestImport}
          latestLog={summary.latestLog}
        />
      </div>
    </main>
  );
}

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-1">{label}</p>
      <p className="break-words text-sm font-semibold leading-snug text-white">
        {value}
      </p>
    </div>
  );
}
