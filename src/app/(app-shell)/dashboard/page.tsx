import type { Metadata } from "next";

import { db } from "@/db/client";
import {
  buildAppleHealthDashboardMetrics,
  getAppleHealthDashboardMetricTypes,
} from "@/lib/apple-health/display";
import {
  formatDistanceValueMiles,
  formatDurationCompact,
  formatElevationFeetValue,
  formatPaceFromSecondsPerMile,
  formatRoundedMetric,
  formatRunDayDate,
  formatWeekRangeLabel,
} from "@/lib/dashboard/format";
import {
  DashboardHealthClusterCard,
  DashboardMetricTile,
  DashboardRecentRunCard,
  DashboardRecoveryCard,
  DashboardTrainingLoadCard,
  DashboardWeeklySummaryCard,
} from "@/components/visual-reboot";
import {
  getAppleHealthImportSummary,
  getAppleHealthMetricTrendSeries,
  getLatestAppleHealthMetrics,
} from "@/server/apple-health/queries";
import {
  getDashboardRunningSnapshot,
  type DashboardRunSnapshot,
} from "@/server/dashboard/strava";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | FarSygil",
  description:
    "FarSygil command center with real Strava-backed running metrics and honest empty states for deferred health and training-load surfaces.",
};

export default async function DashboardPage() {
  const healthMetricTypes = getAppleHealthDashboardMetricTypes();
  const [
    runningSnapshot,
    latestHealthMetrics,
    healthTrendSeries,
    healthSummary,
  ] = await Promise.all([
    getDashboardRunningSnapshot(db),
    getLatestAppleHealthMetrics(db, healthMetricTypes),
    getAppleHealthMetricTrendSeries(db, healthMetricTypes),
    getAppleHealthImportSummary(db),
  ]);
  const recentRunMetric = buildRunMetric(runningSnapshot.recentRun);
  const longestRunMetric = buildRunMetric(runningSnapshot.longestRun);

  return (
    <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
      <section className="px-1 pt-1">
        <p className="section-kicker mb-3">Dashboard</p>
        <h1 className="text-[2.9rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
          Dashboard
        </h1>
      </section>

      <DashboardWeeklySummaryCard
        title="This Week"
        subtitle={formatWeekRangeLabel(
          runningSnapshot.weekStartDate,
          runningSnapshot.weekEndDate,
        )}
        href="/runs"
        items={[
          {
            label: "Distance",
            value: formatDistanceValueMiles(runningSnapshot.totalDistanceMeters),
            unit: "mi",
            tone: "distance",
            icon: "distance",
            chartType: "bar",
            chartValues: runningSnapshot.distanceSeriesMiles,
          },
          {
            label: "Time",
            value: formatDurationCompact(runningSnapshot.totalMovingTimeSeconds),
            tone: "time",
            icon: "time",
            chartType: "bar",
            chartValues: runningSnapshot.movingTimeSeriesMinutes,
          },
          {
            label: "Avg Pace",
            value: formatPaceFromSecondsPerMile(
              runningSnapshot.averagePaceSecondsPerMile,
            ),
            unit:
              runningSnapshot.averagePaceSecondsPerMile != null ? "/mi" : undefined,
            tone: "distance",
            icon: "pace",
            chartType: "line",
            chartValues: runningSnapshot.paceSeriesSecondsPerMile,
            emptyHint:
              "Requires at least one real run with distance and moving time in the current week.",
          },
          {
            label: "Elevation",
            value: formatElevationFeetValue(runningSnapshot.totalElevationGain),
            unit: "ft",
            tone: "time",
            icon: "elevation",
            chartType: "line",
            chartValues: runningSnapshot.elevationSeriesFeet,
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.85fr)]">
        <DashboardRecentRunCard
          title="Recent Run"
          href={
            runningSnapshot.recentRun
              ? `/runs/${runningSnapshot.recentRun.id}`
              : undefined
          }
          sportLabel={resolveRunSurfaceLabel(runningSnapshot.recentRun?.sportType)}
          value={recentRunMetric.value}
          unit={recentRunMetric.unit}
          detail={
            formatRunDayDate(
              runningSnapshot.recentRun?.startDateLocal ??
                runningSnapshot.recentRun?.startDate ??
                null,
            ) ?? undefined
          }
          source="Strava"
          hint={recentRunMetric.hint}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <DashboardMetricTile
            title="Longest Run"
            tone="exercise"
            icon="run"
            source="Strava"
            value={longestRunMetric.value}
            unit={longestRunMetric.unit}
            href={
              runningSnapshot.longestRun
                ? `/runs/${runningSnapshot.longestRun.id}`
                : undefined
            }
            chartValues={runningSnapshot.distanceSeriesMiles}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.6fr)]">
        <DashboardMetricTile
          title="Avg Cadence"
          tone="distance"
          icon="cadence"
          source="Strava"
          value={formatRoundedMetric(runningSnapshot.averageCadence)}
          unit={runningSnapshot.averageCadence != null ? "spm" : undefined}
          chartValues={runningSnapshot.cadenceSeries}
        />
        <DashboardMetricTile
          title="Avg HR"
          tone="cardio"
          icon="heartrate"
          source="Strava"
          value={formatRoundedMetric(runningSnapshot.averageHeartrate)}
          unit={runningSnapshot.averageHeartrate != null ? "bpm" : undefined}
          chartValues={runningSnapshot.heartrateSeries}
        />
        <DashboardMetricTile
          title="Avg Power"
          tone="recovery"
          icon="spark"
          source="Strava"
          value={null}
          hint="Data not available until real local runs include synced power or watt fields."
        />
        <DashboardHealthClusterCard
          title="Health & Wellness"
          sourceLabel="Apple Health"
          metrics={buildAppleHealthDashboardMetrics(
            latestHealthMetrics,
            healthTrendSeries,
          )}
          hint={
            healthSummary.metricRows > 0
              ? `Latest local Apple Health metric date: ${
                  healthSummary.latestMetricDate ?? "--"
                }.`
              : "Data not available until the Apple Health importer writes real physiology rows into local SQLite."
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <DashboardTrainingLoadCard
          hint="Data not available until the training-load engine computes ATL, CTL, TSB, and related analytics from real local activity history."
        />
        <DashboardRecoveryCard
          hint="Data not available until the recovery surface can be derived from imported health metrics and training-load computations."
        />
      </div>
    </main>
  );
}

function buildRunMetric(run: DashboardRunSnapshot | null): {
  value: string | null;
  unit?: string;
  hint?: string;
} {
  if (!run) {
    return {
      value: null,
    };
  }

  const distanceValue =
    typeof run.distanceMeters === "number" && run.distanceMeters > 0
      ? formatDistanceValueMiles(run.distanceMeters)
      : null;

  if (!distanceValue) {
    return {
      value: null,
      hint: run.name ?? undefined,
    };
  }

  return {
    value: distanceValue,
    unit: "mi",
    hint: run.name ?? undefined,
  };
}

function resolveRunSurfaceLabel(value: string | null | undefined): string {
  switch (value) {
    case "TrailRun":
      return "Trail Run";
    case "VirtualRun":
      return "Virtual Run";
    case "Run":
    default:
      return "Outdoor Run";
  }
}
