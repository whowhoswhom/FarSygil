import Link from "next/link";
import type { Metadata } from "next";

import { RoutePreview } from "@/components/activities/route-preview";
import { SourceLabel } from "@/components/dashboard";
import { ActivitySessionCard } from "@/components/runs/activity-session-card";
import { MetricIconBadge } from "@/components/visual-reboot";
import { db } from "@/db/client";
import {
  formatRunDateTime,
  formatRunDistanceValue,
  formatRunDuration,
  formatRunPaceFromActivity,
} from "@/lib/runs/format";
import { getArchivedRuns, getRunsCount } from "@/server/runs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Runs | FarSygil",
  description:
    "Run-first local archive with a featured latest run and detailed real-data run pages.",
};

export default async function RunsPage() {
  const [runs, totalRuns] = await Promise.all([
    getArchivedRuns(db),
    getRunsCount(db),
  ]);
  const featuredRun = runs[0] ?? null;
  const remainingRuns = featuredRun ? runs.slice(1) : [];

  if (!featuredRun) {
    return (
      <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
        <section className="dashboard-shell-card p-6 md:p-8">
          <div className="relative flex flex-col gap-6">
            <div>
              <p className="section-kicker mb-3">Runs</p>
              <h1 className="text-[3rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
                No runs have been archived yet.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
                Connect Strava, run a summary sync, then pull missing detail rows
                to unlock splits, heart-rate streams, and richer run pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="/api/strava/connect"
                className="accent-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                Connect Strava
              </a>
              <Link
                href="/connect"
                className="ghost-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open Connect
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const featuredPace = formatRunPaceFromActivity(featuredRun);

  return (
    <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
      <section className="px-1 pt-1">
        <p className="section-kicker mb-3">Runs</p>
        <h1 className="text-[2.9rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
          Runs
        </h1>
      </section>

      <section className="dashboard-shell-card p-5 md:p-6">
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_480px] xl:items-center">
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <MetricIconBadge tone="exercise" icon="run" size="lg" />
                <div className="min-w-0">
                  <p className="section-kicker mb-2">Latest Run</p>
                  <h2 className="line-clamp-2 text-[2.8rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[4rem]">
                    {featuredRun.name ?? "Untitled run"}
                  </h2>
                </div>
              </div>
              <SourceLabel source="Strava" tone="exercise" />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <ArchiveHeroMetric
                label="Distance"
                value={formatRunDistanceValue(featuredRun.distanceMeters) ?? "--"}
                unit={featuredRun.distanceMeters ? "mi" : undefined}
                tone="var(--metric-exercise)"
              />
              <ArchiveHeroMetric
                label="Moving"
                value={formatRunDuration(featuredRun.movingTimeSeconds)}
                tone="var(--metric-time)"
              />
              <ArchiveHeroMetric
                label="Pace"
                value={featuredPace ?? "--"}
                unit={featuredPace ? "/mi" : undefined}
                tone="var(--metric-distance)"
              />
              <ArchiveHeroMetric
                label="Stored"
                value={String(totalRuns)}
                unit={totalRuns === 1 ? "run" : "runs"}
                tone="var(--metric-recovery)"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-base text-[var(--ink-2)]">
                {formatRunDateTime(
                  featuredRun.startDateLocal ?? featuredRun.startDate,
                ) ?? "Date not available"}
              </p>
              <Link
                href={`/runs/${featuredRun.id}`}
                className="accent-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open run detail
              </Link>
            </div>
          </div>

          <RoutePreview
            activityId={featuredRun.id}
            pathData={featuredRun.routePathData}
            className="min-h-[320px] w-full rounded-[28px]"
            chipLabel={
              featuredRun.distanceMeters
                ? `${formatRunDistanceValue(featuredRun.distanceMeters)} mi`
                : undefined
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="section-kicker mb-2">Archive</p>
            <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-white">
              All runs
            </h2>
          </div>
          <p className="text-sm text-[var(--ink-3)]">
            {totalRuns} {totalRuns === 1 ? "run" : "runs"} stored locally
          </p>
        </div>

        <div className="grid gap-5">
          {remainingRuns.length > 0 ? (
            remainingRuns.map((run) => (
              <ActivitySessionCard key={run.id} activity={run} />
            ))
          ) : (
            <div className="dashboard-shell-card p-6">
              <div className="relative">
                <p className="text-base text-[var(--ink-2)]">
                  This archive currently holds one synced run. Additional runs
                  will appear here after your next Strava sync.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ArchiveHeroMetric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-black/10 px-4 py-4">
      <p className="text-sm font-medium text-[var(--ink-2)]">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <span
          className="dashboard-tile-value text-[2.4rem] font-semibold"
          style={{ color: tone }}
        >
          {value}
        </span>
        {unit ? (
          <span className="pb-1 text-sm font-medium text-[var(--ink-2)]">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
