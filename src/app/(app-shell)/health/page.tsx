import {
  DashboardHealthClusterCard,
  MetricIconBadge,
} from "@/components/visual-reboot";
import { AppleHealthImportPanel } from "@/components/health/apple-health-import-panel";
import { db } from "@/db/client";
import {
  buildAppleHealthDashboardMetrics,
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
              Daily health metrics render only after a local Apple Health ZIP or
              extracted export XML has been imported into SQLite.
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
        metrics={buildAppleHealthDashboardMetrics(latestMetrics, trendSeries)}
        hint={
          summary.metricRows > 0
            ? `Latest local Apple Health metric date: ${summary.latestMetricDate ?? "--"}.`
            : "Data not available until the Apple Health importer parses real exports and stores daily metric rows locally."
        }
      />
    </main>
  );
}
