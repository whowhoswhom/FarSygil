import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppIcon } from "@/components/app-shell/app-icons";
import { RunSplitTable } from "@/components/runs/run-split-table";
import {
  RunAuthorityCard,
  RunChartTile,
  RunDetailHero,
} from "@/components/visual-reboot";
import { db } from "@/db/client";
import {
  formatDistanceValueMiles,
  formatPaceFromSecondsPerMile,
  formatRoundedMetric,
  formatRunClockTime,
  formatRunDayDate,
} from "@/lib/dashboard/format";
import {
  formatRunElevationFeet,
  formatRunHeartrate,
  formatRunPaceFromActivity,
  type SplitUnit,
} from "@/lib/runs/format";
import { getDashboardRunningSnapshot } from "@/server/dashboard/strava";
import { getRunDetailSnapshot } from "@/server/runs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Run Detail | FarSygil",
  description:
    "Detailed run view backed by local Strava rows, faux-map route previews, split rows, and local stream data when available.",
};

export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ splitUnit?: string }>;
}) {
  const [{ id }, { splitUnit }] = await Promise.all([params, searchParams]);
  const activityId = Number(id);

  if (!Number.isInteger(activityId) || activityId <= 0) {
    notFound();
  }

  const [detail, dashboardSnapshot] = await Promise.all([
    getRunDetailSnapshot(db, activityId),
    getDashboardRunningSnapshot(db),
  ]);

  if (!detail) {
    notFound();
  }

  const resolvedUnit: SplitUnit = splitUnit === "km" ? "km" : "mi";
  const pace = formatRunPaceFromActivity(detail.activity);
  const heartRateValue =
    detail.activity.averageHeartrate != null
      ? Math.round(detail.activity.averageHeartrate)
      : detail.heartrateSeries.length > 0
        ? Math.round(
            detail.heartrateSeries.reduce((total, value) => total + value, 0) /
              detail.heartrateSeries.length,
          )
        : null;
  const isLongestRunThisWeek =
    dashboardSnapshot.longestRun?.id === detail.activity.id;

  return (
    <main className="page-shell flex flex-col gap-4 pb-5 text-[var(--ink-1)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
        <Link
          href="/runs"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[var(--ink-2)] hover:text-white"
          aria-label="Back to runs"
        >
          <AppIcon name="arrow-left" className="text-lg" />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[var(--ink-2)] hover:text-white"
          aria-label="Return to dashboard"
        >
          <AppIcon name="dashboard" className="text-lg" />
        </Link>
      </div>

      <RunDetailHero
        title={detail.activity.name ?? resolveRunSurfaceLabel(detail.activity.sportType)}
        statusLabel="Completed"
        sourceDateLabel={
          formatRunDayDate(
            detail.activity.startDateLocal ?? detail.activity.startDate,
          ) ?? "Date not available"
        }
        sourceTimeLabel={formatRunClockTime(detail.activity.startDateLocal ?? detail.activity.startDate) ?? undefined}
        distanceChipLabel={
          detail.activity.distanceMeters
            ? `${formatDistanceValueMiles(detail.activity.distanceMeters)} mi`
            : undefined
        }
        pathData={detail.activity.routePathData}
        activityId={detail.activity.id}
        statItems={[
          {
            label: "Distance",
            value: formatDistanceValueMiles(detail.activity.distanceMeters ?? 0),
            unit: detail.activity.distanceMeters ? "mi" : undefined,
            toneVar: "var(--metric-distance)",
          },
          {
            label: "Time",
            value: formatDurationValue(detail.activity.movingTimeSeconds),
            toneVar: "var(--metric-time)",
          },
          {
            label: "Avg Pace",
            value: pace ?? "--",
            unit: pace ? "/mi" : undefined,
            toneVar: "var(--metric-distance)",
          },
          {
            label: "Elevation",
            value: formatRunElevationFeet(detail.activity.totalElevationGain),
            unit: detail.activity.totalElevationGain != null ? "ft" : undefined,
            toneVar: "var(--metric-time)",
          },
          {
            label: "Avg HR",
            value: heartRateValue != null ? formatRunHeartrate(heartRateValue) : "--",
            unit: heartRateValue != null ? "bpm" : undefined,
            toneVar: "var(--metric-cardio)",
          },
        ]}
      />

      <RunSplitTable
        splits={detail.splits}
        unit={resolvedUnit}
        hrefBuilder={(unit) => `/runs/${detail.activity.id}?splitUnit=${unit}`}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <RunChartTile
          title="Pace"
          tone="distance"
          icon="pace"
          value={pace}
          unit={pace ? "/mi" : undefined}
          chartValues={detail.paceSeriesSecondsPerMile}
          guideLabels={buildPaceGuideLabels(detail.paceSeriesSecondsPerMile)}
          hint="Data not available until FarSygil has a real local pace series from split rows or synced streams."
        />
        <RunChartTile
          title="Heart Rate"
          tone="cardio"
          icon="heartrate"
          value={heartRateValue != null ? formatRunHeartrate(heartRateValue) : null}
          unit={heartRateValue != null ? "bpm" : undefined}
          chartValues={detail.heartrateSeries}
          guideLabels={buildRangeLabels(detail.heartrateSeries)}
          hint="Data not available until this run has real heart-rate stream or split data."
        />
        <RunChartTile
          title="Cadence"
          tone="recovery"
          icon="cadence"
          value={formatRoundedMetric(detail.activity.averageCadence)}
          unit={detail.activity.averageCadence != null ? "spm" : undefined}
          chartValues={detail.cadenceSeries}
          guideLabels={buildRangeLabels(detail.cadenceSeries)}
          hint="Data not available until Strava detail sync writes cadence stream rows locally."
        />
        <RunChartTile
          title="Elevation"
          tone="time"
          icon="elevation"
          value={
            detail.activity.totalElevationGain != null
              ? formatRunElevationFeet(detail.activity.totalElevationGain)
              : null
          }
          unit={detail.activity.totalElevationGain != null ? "ft" : undefined}
          chartValues={detail.elevationSeriesFeet}
          guideLabels={buildRangeLabels(detail.elevationSeriesFeet)}
          hint="Data not available until FarSygil has a real local elevation profile for this run."
        />
      </div>

      <RunAuthorityCard
        title="Strava"
        body="Strava stays authoritative for run data. FarSygil only renders route, split, and stream surfaces when those rows exist in local SQLite."
      />

      {isLongestRunThisWeek ? (
        <section className="dashboard-shell-card p-5 md:p-6">
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] border border-[rgba(167,244,61,0.16)] bg-[rgba(167,244,61,0.1)] text-[var(--metric-exercise)]">
                <AppIcon name="spark" className="text-[1.4rem]" />
              </span>
              <div className="min-w-0">
                <p className="text-[1.8rem] font-semibold tracking-[-0.04em] text-white">
                  Longest run this week
                </p>
                <p className="mt-2 text-sm text-[var(--ink-2)]">
                  This was the longest run in the current 7-day dashboard window.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-[var(--ink-2)]">
              Derived
            </span>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function buildRangeLabels(values: number[]): string[] {
  if (values.length < 2) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [];
  }

  const midpoint = Math.round((min + max) / 2);
  return [Math.round(max), midpoint, Math.round(min)].map(String);
}

function buildPaceGuideLabels(values: number[]): string[] {
  if (values.length < 2) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const midpoint = (min + max) / 2;

  return [min, midpoint, max]
    .map((value) => formatPaceFromSecondsPerMile(value))
    .filter((value): value is string => value != null);
}

function formatDurationValue(value: number | null): string {
  if (!value || value <= 0) {
    return "--";
  }

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);

  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m`;
}

function resolveRunSurfaceLabel(value: string | null): string {
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
