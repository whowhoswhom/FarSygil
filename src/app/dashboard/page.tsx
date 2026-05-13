import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { db } from "@/db/client";
import {
  DashboardHeader,
  DashboardShell,
  LargeMetricCard,
  LastSyncedBadge,
  MetricCard,
  SectionHeader,
  StatusBadge,
  TimeRangeToggle,
  TrendCard,
} from "@/components/dashboard";
import {
  getDashboardHeaderSnapshot,
  getDashboardRunningSnapshot,
  metersToFeet,
  type DashboardRunSnapshot,
} from "@/server/dashboard/strava";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | FarSygil",
  description:
    "Local-first running command center. Running metrics now read from the local Strava archive while health and training-load surfaces stay gated behind later phases.",
};

export default async function DashboardPage() {
  const [headerSnapshot, runningSnapshot] = await Promise.all([
    getDashboardHeaderSnapshot(db),
    getDashboardRunningSnapshot(db),
  ]);

  const recentRunMetric = buildRunMetric(runningSnapshot.recentRun);
  const longestRunMetric = buildRunMetric(runningSnapshot.longestRun);
  const runCountLabel =
    runningSnapshot.runCount === 1 ? "1 run this week" : `${runningSnapshot.runCount} runs this week`;

  return (
    <DashboardShell>
      <DashboardHeader
        kicker="Dashboard"
        title="FarSygil"
        description="Local-first running command center. Running metrics now read from your local Strava archive, while Health and Training Load remain honest empty-state placeholders until their systems land."
        meta={
          <>
            <StatusBadge
              label={headerSnapshot.statusLabel}
              state={headerSnapshot.statusState}
            />
            <LastSyncedBadge
              label="Last synced"
              value={formatDashboardTimestamp(headerSnapshot.lastSyncedAt)}
            />
          </>
        }
        actions={
          <>
            <TimeRangeToggle activeValue="W" disabled />
            <Link
              href="/connect"
              className="ghost-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Manage connection
            </Link>
          </>
        }
      />

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="Phase 2"
          title="Running"
          description="These cards now read your local Strava archive for the current week, the latest run, and the strongest basic trends. No fabricated metrics or placeholder chart data are rendered."
        />
        <div className="dashboard-grid lg:grid-cols-3">
          <LargeMetricCard
            title="This Week"
            subtitle={formatWeekRangeLabel(
              runningSnapshot.weekStartDate,
              runningSnapshot.weekEndDate,
            )}
            tone="distance"
            source="Strava"
            value={formatDistanceValueMiles(runningSnapshot.totalDistanceMeters)}
            unit="mi"
            hint={runCountLabel}
            chartType="bar"
            chartValues={runningSnapshot.distanceSeriesMiles}
            className="lg:col-span-2"
          >
            <div className="grid gap-4 sm:grid-cols-4">
              <DashboardStatCell
                label="Moving"
                value={formatDurationCompact(runningSnapshot.totalMovingTimeSeconds)}
              />
              <DashboardStatCell
                label="Avg pace"
                value={
                  formatPaceFromSecondsPerMile(
                    runningSnapshot.averagePaceSecondsPerMile,
                  ) ?? "--"
                }
                unit={
                  runningSnapshot.averagePaceSecondsPerMile == null
                    ? undefined
                    : "/mi"
                }
              />
              <DashboardStatCell
                label="Elevation"
                value={formatElevationFeetValue(runningSnapshot.totalElevationGain)}
                unit="ft"
              />
              <DashboardStatCell
                label="Runs"
                value={String(runningSnapshot.runCount)}
              />
            </div>
          </LargeMetricCard>

          <MetricCard
            title="Recent Run"
            tone="exercise"
            source="Strava"
            value={recentRunMetric.value}
            unit={recentRunMetric.unit}
            detail={recentRunMetric.detail}
            hint={recentRunMetric.hint}
          />
          <MetricCard
            title="Longest Run"
            tone="exercise"
            source="Strava"
            value={longestRunMetric.value}
            unit={longestRunMetric.unit}
            detail={longestRunMetric.detail}
            hint={longestRunMetric.hint}
          />
          <MetricCard
            title="Avg Cadence"
            tone="trend"
            source="Strava"
            value={formatRoundedMetric(runningSnapshot.averageCadence)}
            unit={runningSnapshot.averageCadence == null ? undefined : "spm"}
            hint="Weighted across current-week local runs with cadence data."
            chartValues={runningSnapshot.cadenceSeries}
          />
          <MetricCard
            title="Avg HR"
            tone="cardio"
            source="Strava"
            value={formatRoundedMetric(runningSnapshot.averageHeartrate)}
            unit={runningSnapshot.averageHeartrate == null ? undefined : "bpm"}
            hint="Weighted across current-week local runs with heart-rate data."
            chartValues={runningSnapshot.heartrateSeries}
          />
          <TrendCard
            title="Pace Trend"
            tone="distance"
            source="Strava"
            value={formatPaceFromSecondsPerMile(runningSnapshot.averagePaceSecondsPerMile)}
            unit={runningSnapshot.averagePaceSecondsPerMile == null ? undefined : "/mi"}
            hint="Current-week pace trend from real local Strava runs only."
            chartValues={runningSnapshot.paceSeriesSecondsPerMile}
            className="lg:col-span-3"
          />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="Phase 2"
          title="Health"
          description="Apple Health remains authoritative for physiology data. The dashboard scaffold is ready, but the importer must land before any wellness cards can render."
        />
        <div className="dashboard-grid lg:grid-cols-3">
          <LargeMetricCard
            title="Health & Wellness"
            subtitle="Imported from Apple Health"
            tone="cardio"
            source="Apple Health"
            hint="Resting heart rate, HRV, sleep, steps, and VO2 max stay empty until the Apple Health importer populates the local database."
            className="lg:col-span-2"
          />
          <MetricCard
            title="Resting HR"
            tone="move"
            source="Apple Health"
            hint="No physiology values are rendered until Apple Health imports real rows."
          />
          <MetricCard
            title="HRV"
            tone="recovery"
            source="Apple Health"
            hint="Short-form health metrics stay empty until the importer and dashboard queries exist."
          />
          <TrendCard
            title="Recovery Trend"
            tone="recovery"
            source="Apple Health"
            hint="Recovery trends require real imported daily values and remain intentionally blank for now."
          />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeader
          kicker="Phase 2"
          title="Training Load"
          description="Derived analytics remain intentionally absent until the load model ships. PR C wires only real Strava-backed running cards and keeps this section honestly empty."
        />
        <div className="dashboard-grid lg:grid-cols-3">
          <LargeMetricCard
            title="Training Load"
            subtitle="Derived analytics"
            tone="trend"
            source="Derived"
            hint="ATL, CTL, TSB, and ACWR stay hidden until the training-load module computes them from real local activity data."
            className="lg:col-span-2"
          />
          <MetricCard
            title="Recovery"
            tone="recovery"
            source="Derived"
            hint="Recovery guidance remains unavailable until derived training-load metrics are implemented."
          />
          <MetricCard
            title="Load Warning"
            tone="trend"
            source="Derived"
            hint="Warning surfaces appear only when real acute/chronic load comparisons are available."
          />
          <TrendCard
            title="Load Trend"
            tone="trend"
            source="Derived"
            hint="No derived trend line is shown until the analytics module can produce one honestly."
          />
        </div>
      </section>

      <footer className="surface-slab relative rounded-[26px] px-6 py-6 sm:px-8">
        <div
          className="dashboard-card-accent"
          style={
            {
              "--dashboard-tone": "var(--accent-core)",
              "--dashboard-tone-wash": "rgba(123, 194, 65, 0.08)",
            } as CSSProperties
          }
        />
        <div className="relative flex flex-col gap-3 text-sm text-[var(--ink-2)]">
          <p>
            <code>/dashboard</code> now reads the Running section from your
            local Strava archive while keeping the other sections intentionally
            empty until their real data systems land.
          </p>
          <p>
            Live Strava status and manual sync controls stay on{" "}
            <Link
              href="/connect"
              className="underline decoration-dotted underline-offset-4 hover:text-[var(--ink-1)]"
            >
              <code>/connect</code>
            </Link>
            . Full archive browsing remains on{" "}
            <Link
              href="/activities"
              className="underline decoration-dotted underline-offset-4 hover:text-[var(--ink-1)]"
            >
              <code>/activities</code>
            </Link>
            .
          </p>
        </div>
      </footer>
    </DashboardShell>
  );
}

function DashboardStatCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-4">
      <p className="dashboard-card-title uppercase tracking-[0.18em]">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-lg font-semibold text-[var(--ink-1)]">{value}</span>
        {unit ? (
          <span className="pb-0.5 text-xs font-medium text-[var(--ink-3)]">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function formatDashboardTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatWeekRangeLabel(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "This week";
  }

  const startMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(start);
  const endMonth = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(end);
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

function formatDistanceValueMiles(meters: number): string {
  const miles = meters / 1609.344;
  return miles >= 100 ? miles.toFixed(0) : miles.toFixed(1);
}

function formatDurationCompact(seconds: number): string {
  if (seconds <= 0) {
    return "0m";
  }

  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m`;
}

function formatPaceFromSecondsPerMile(
  secondsPerMile: number | null,
): string | null {
  if (secondsPerMile == null || secondsPerMile <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.round(secondsPerMile % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function formatElevationFeetValue(meters: number): string {
  return `${Math.round(metersToFeet(meters)).toLocaleString()}`;
}

function formatRoundedMetric(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return `${Math.round(value)}`;
}

function buildRunMetric(run: DashboardRunSnapshot | null): {
  value: string | null;
  unit?: string;
  detail?: string;
  hint?: string;
} {
  if (!run) {
    return {
      value: null,
      hint: undefined,
    };
  }

  const distanceValue =
    typeof run.distanceMeters === "number" && run.distanceMeters > 0
      ? formatDistanceValueMiles(run.distanceMeters)
      : null;
  const paceValue =
    typeof run.distanceMeters === "number" &&
    run.distanceMeters > 0 &&
    typeof run.movingTimeSeconds === "number" &&
    run.movingTimeSeconds > 0
      ? formatPaceFromSecondsPerMile(
          run.movingTimeSeconds / (run.distanceMeters / 1609.344),
        )
      : null;
  const detail = formatRunDate(run.startDateLocal ?? run.startDate);
  const hintParts = [run.name ?? "Untitled effort"];

  if (paceValue) {
    hintParts.push(`${paceValue} /mi`);
  }

  if (run.averageHeartrate != null && Number.isFinite(run.averageHeartrate)) {
    hintParts.push(`${Math.round(run.averageHeartrate)} bpm`);
  }

  if (distanceValue) {
    return {
      value: distanceValue,
      unit: "mi",
      detail,
      hint: hintParts.join(" | "),
    };
  }

  if (
    typeof run.movingTimeSeconds === "number" &&
    Number.isFinite(run.movingTimeSeconds)
  ) {
    return {
      value: formatDurationCompact(run.movingTimeSeconds),
      detail,
      hint: hintParts.join(" | "),
    };
  }

  return {
    value: null,
    detail,
    hint: hintParts.join(" | "),
  };
}

function formatRunDate(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}
