import type { Metadata } from "next";

import { databasePath, db } from "@/db/client";
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
  dashboardWeekDateFromDateOnly,
  getDashboardWeekHref,
  resolveDashboardWeekSelection,
} from "@/lib/dashboard/week-selection";
import {
  ArchiveStatusCard,
  DailyBatteryDeferredCard,
  type DailyBatteryInput,
  DashboardDailyStressCard,
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
  type AppleHealthMetricSnapshot,
} from "@/server/apple-health/queries";
import { getArchiveStatusSnapshot } from "@/server/archive/status";
import {
  getDashboardRunningSnapshot,
  type DashboardRunSnapshot,
} from "@/server/dashboard/strava";
import { getDailyTrainingStressSnapshot } from "@/server/training-load/daily-stress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | FarSygil",
  description:
    "FarSygil command center with real Strava, Apple Health, daily stress, and local archive provenance surfaces.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const weekSelection = resolveDashboardWeekSelection(resolvedSearchParams.week);
  const healthMetricTypes = getAppleHealthDashboardMetricTypes();
  const [
    runningSnapshot,
    latestHealthMetrics,
    healthTrendSeries,
    healthSummary,
    dailyStress,
    archiveStatus,
  ] = await Promise.all([
    getDashboardRunningSnapshot(
      db,
      dashboardWeekDateFromDateOnly(weekSelection.selectedWeekStartDate),
    ),
    getLatestAppleHealthMetrics(db, healthMetricTypes),
    getAppleHealthMetricTrendSeries(db, healthMetricTypes),
    getAppleHealthImportSummary(db),
    getDailyTrainingStressSnapshot(db),
    getArchiveStatusSnapshot(db, { databasePath }),
  ]);
  const recentRunMetric = buildRunMetric(runningSnapshot.recentRun);
  const longestRunMetric = buildRunMetric(runningSnapshot.longestRun);
  const batteryInputs = buildDailyBatteryInputs(
    latestHealthMetrics,
    dailyStress.latest,
  );

  return (
    <main className="page-shell flex flex-col gap-3 pb-5 text-[var(--ink-1)]">
      <section className="px-1 lg:-mt-[3.55rem] lg:max-w-[20rem]">
        <h1 className="text-[2rem] font-semibold tracking-[-0.065em] text-white md:text-[2.45rem]">
          Dashboard
        </h1>
      </section>

      <DashboardWeeklySummaryCard
        title={weekSelection.isCurrentWeek ? "This Week" : "Selected Week"}
        subtitle={formatWeekRangeLabel(
          runningSnapshot.weekStartDate,
          runningSnapshot.weekEndDate,
        )}
        href="/runs"
        weekNavigation={{
          previousHref: getDashboardWeekHref(
            weekSelection.previousWeekStartDate,
            weekSelection.currentWeekStartDate,
          ),
          nextHref: weekSelection.nextWeekStartDate
            ? getDashboardWeekHref(
                weekSelection.nextWeekStartDate,
                weekSelection.currentWeekStartDate,
              )
            : null,
          currentHref: "/dashboard",
          isCurrentWeek: weekSelection.isCurrentWeek,
        }}
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
              "Requires at least one real run with distance and moving time in the selected week.",
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

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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

          <DashboardDailyStressCard
            latest={dailyStress.latest}
            series={dailyStress.series}
          />
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.55fr)]">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
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
            value={formatRoundedMetric(runningSnapshot.averagePowerWatts)}
            unit={runningSnapshot.averagePowerWatts != null ? "W" : undefined}
            hint="Data not available until the selected week has real Strava runs with average watts and moving time."
            chartValues={runningSnapshot.powerSeries}
          />
        </div>

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

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <DashboardTrainingLoadCard
          hint="Data not available until FarSygil computes ATL, CTL, TSB, and related load metrics from daily stress history."
        />
        <DashboardRecoveryCard
          hint="Data not available until recovery can be derived from imported health signals and computed load values."
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <DailyBatteryDeferredCard
          inputs={batteryInputs}
          href="/training-load"
        />
        <ArchiveStatusCard snapshot={archiveStatus} href="/archive" compact />
      </div>
    </main>
  );
}

function buildDailyBatteryInputs(
  healthMetrics: AppleHealthMetricSnapshot[],
  dailyStress: { date: string; dailyTrainingStress: number } | null,
): DailyBatteryInput[] {
  const healthMetricByType = new Map(
    healthMetrics.map((metric) => [metric.metricType, metric]),
  );

  return [
    buildHealthInput("HRV", "hrv", healthMetricByType),
    buildHealthInput("Resting HR", "resting_hr", healthMetricByType),
    buildHealthInput("Sleep", "sleep_hours", healthMetricByType),
    {
      label: "Daily Stress",
      source: "Derived",
      available: dailyStress != null,
      href: "/training-load",
      detail: dailyStress
        ? `Computed local stress exists for ${dailyStress.date}.`
        : "Missing computed daily stress from /training-load.",
    },
  ];
}

function buildHealthInput(
  label: string,
  metricType: string,
  metricsByType: Map<string, AppleHealthMetricSnapshot>,
): DailyBatteryInput {
  const metric = metricsByType.get(metricType);
  const hasValue =
    typeof metric?.value === "number" && Number.isFinite(metric.value);

  return {
    label,
    source: "Apple Health",
    available: hasValue,
    href: "/health",
    detail: hasValue
      ? `Latest Apple Health ${label} exists for ${metric.date}.`
      : `Missing Apple Health ${label} in local SQLite.`,
  };
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
