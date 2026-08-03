import Link from "next/link";
import type { Metadata } from "next";

import { RoutePreview } from "@/components/activities/route-preview";
import { SourceLabel } from "@/components/dashboard";
import { ActivitySessionCard } from "@/components/runs/activity-session-card";
import { MetricIconBadge, PageMasthead } from "@/components/visual-reboot";
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
      <main className="page-shell fs-view flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
        <section className="dashboard-shell-card p-6 md:p-8">
          <div className="relative flex flex-col gap-6">
            <div>
              <p className="fs-eyebrow mb-3">Runs</p>
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
    <main className="page-shell fs-view flex flex-col gap-8 pb-5 text-[var(--ink-1)]">
      <PageMasthead
        eyebrow="Local archive"
        title="Runs"
        sub="Every real effort, newest first. Strava stays the authority for run data."
        actions={
          <p className="rounded-full border border-[var(--fs-line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-2)]">
            {totalRuns} {totalRuns === 1 ? "run" : "runs"} stored locally
          </p>
        }
      />

      <section className="dashboard-shell-card p-4 md:p-5">
        <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_380px] xl:items-center">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <MetricIconBadge tone="exercise" icon="run" />
                <div className="min-w-0">
                  <p className="section-kicker mb-1">Latest Run</p>
                  <h2 className="line-clamp-2 text-[2rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white md:text-[2.9rem]">
                    {featuredRun.name ?? "Untitled run"}
                  </h2>
                </div>
              </div>
              <SourceLabel source="Strava" tone="exercise" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--ink-2)]">
                {formatRunDateTime(
                  featuredRun.startDateLocal ?? featuredRun.startDate,
                ) ?? "Date not available"}
              </p>
              <Link
                href={`/runs/${featuredRun.id}`}
                className="accent-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold md:px-5 md:py-3 md:text-sm"
              >
                Open run detail
              </Link>
            </div>
          </div>

          <RoutePreview
            activityId={featuredRun.id}
            pathData={featuredRun.routePathData}
            className="min-h-[190px] w-full rounded-[24px] md:min-h-[240px]"
            chipLabel={
              featuredRun.distanceMeters
                ? `${formatRunDistanceValue(featuredRun.distanceMeters)} mi`
                : undefined
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="section-kicker mb-1">Archive</p>
            <h2 className="text-[1.75rem] font-semibold tracking-[-0.05em] text-white">
              All runs
            </h2>
          </div>
          <p className="text-sm text-[var(--ink-3)]">
            {totalRuns} {totalRuns === 1 ? "run" : "runs"} stored locally
          </p>
        </div>

        <div className="grid gap-3">
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
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="text-xs font-medium text-[var(--ink-2)]">{label}</p>
      <div className="mt-1 flex items-end gap-1.5">
        <span
          className="dashboard-tile-value text-[1.7rem] font-semibold md:text-[2rem]"
          style={{ color: tone }}
        >
          {value}
        </span>
        {unit ? (
          <span className="pb-0.5 text-xs font-medium text-[var(--ink-2)]">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
