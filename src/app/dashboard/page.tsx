import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

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

export const metadata: Metadata = {
  title: "Dashboard | FarSygil",
  description:
    "Local-first running command center. Dashboard scaffolding is in place while real metrics remain gated behind later phased PRs.",
};

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        kicker="Dashboard"
        title="FarSygil"
        description="Local-first running command center. The dashboard shell and card system are now in place, but every surface here remains an honest empty state until real Strava, Apple Health, and training-load queries land."
        meta={
          <>
            <StatusBadge
              label="Connection status on /connect"
              state="unavailable"
            />
            <LastSyncedBadge label="Last synced" value={null} />
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
          description="Strava-backed weekly rollups, recent-run summary, and metric trends land in PR C. This pass only establishes the reusable dashboard chrome."
        />
        <div className="dashboard-grid lg:grid-cols-3">
          <LargeMetricCard
            title="This Week"
            subtitle="Weekly running summary"
            tone="distance"
            source="Strava"
            hint="Weekly distance, moving time, pace, and elevation appear here once dashboard rollups are wired to real local activities."
            className="lg:col-span-2"
          />
          <MetricCard
            title="Recent Run"
            tone="exercise"
            source="Strava"
            hint="The latest synced run will appear here after the dashboard starts reading real archive rows."
          />
          <MetricCard
            title="Longest Run"
            tone="exercise"
            source="Strava"
            hint="Longest-run comparisons stay hidden until real weekly summaries are available."
          />
          <TrendCard
            title="Pace Trend"
            tone="distance"
            source="Strava"
            hint="Trend surfaces stay empty until there is a real time series to draw."
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
          description="Derived analytics remain intentionally absent until the load model ships. PR B only provides the card scaffolding and dashboard token system."
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
            tone="warning"
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
            `/dashboard` now uses reusable dashboard primitives, but it still
            renders only empty states. No fake metrics, fake chart traces, or
            fake provider status are shown here.
          </p>
          <p>
            Live Strava status and manual sync controls stay on{" "}
            <Link
              href="/connect"
              className="underline decoration-dotted underline-offset-4 hover:text-[var(--ink-1)]"
            >
              /connect
            </Link>
            . Real activity browsing remains on{" "}
            <Link
              href="/activities"
              className="underline decoration-dotted underline-offset-4 hover:text-[var(--ink-1)]"
            >
              /activities
            </Link>
            .
          </p>
        </div>
      </footer>
    </DashboardShell>
  );
}
