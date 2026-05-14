import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoutePreview } from "@/components/activities/route-preview";
import { SportPill } from "@/components/activities/sport-pill";
import { SourceLabel, TrendCard } from "@/components/dashboard";
import { RunSplitTable } from "@/components/runs/run-split-table";
import {
  formatRunDateTime,
  formatRunDistanceValue,
  formatRunDuration,
  formatRunElevationFeet,
  formatRunHeartrate,
  formatRunPaceFromActivity,
  type SplitUnit,
} from "@/lib/runs/format";
import { db } from "@/db/client";
import { getRunDetailSnapshot } from "@/server/runs/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Run Detail | FarSygil",
  description:
    "Detailed run view backed by local Strava rows, route previews, split rows, and local heart-rate streams when available.",
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

  const detail = await getRunDetailSnapshot(db, activityId);

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

  return (
    <main className="page-shell min-h-screen px-4 pb-20 pt-6 text-[var(--ink-1)] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1480px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/runs"
            className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
          >
            Back to Runs
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-[var(--ink-3)] hover:text-[var(--ink-1)]"
          >
            Return to Dashboard
          </Link>
        </div>

        <section
          className="surface-slab archive-rise mb-6 rounded-[34px] px-6 py-6 md:px-8 md:py-8"
          data-depth="hero"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px] xl:items-stretch">
            <div className="flex min-w-0 flex-col justify-between gap-8">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <SportPill sportType={detail.activity.sportType} />
                  <SourceLabel source="Strava" tone="exercise" />
                </div>
                <h1 className="ink-safe text-[3rem] font-semibold leading-[0.88] tracking-[-0.07em] text-white md:text-[4.8rem]">
                  {detail.activity.name ?? "Untitled run"}
                </h1>
                <p className="mt-4 text-base text-[var(--ink-2)]">
                  {formatRunDateTime(
                    detail.activity.startDateLocal ?? detail.activity.startDate,
                  )}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <RunSummaryCell
                  label="Distance"
                  value={formatRunDistanceValue(detail.activity.distanceMeters) ?? "--"}
                  unit={
                    detail.activity.distanceMeters != null &&
                    detail.activity.distanceMeters > 0
                      ? "mi"
                      : undefined
                  }
                />
                <RunSummaryCell
                  label="Moving"
                  value={formatRunDuration(detail.activity.movingTimeSeconds)}
                />
                <RunSummaryCell
                  label="Avg Pace"
                  value={pace ?? "--"}
                  unit={pace ? "/mi" : undefined}
                />
                <RunSummaryCell
                  label="Elevation"
                  value={formatRunElevationFeet(detail.activity.totalElevationGain)}
                  unit={
                    detail.activity.totalElevationGain != null ? "ft" : undefined
                  }
                />
              </div>
            </div>

            <RoutePreview
              activityId={detail.activity.id}
              pathData={detail.activity.routePathData}
              className="min-h-[320px] w-full rounded-[28px]"
            />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <RunSplitTable
            splits={detail.splits}
            unit={resolvedUnit}
            hrefBuilder={(unit) => `/runs/${detail.activity.id}?splitUnit=${unit}`}
          />

          <div className="grid gap-6">
            <TrendCard
              title="Heart Rate"
              tone="cardio"
              source="Strava"
              value={heartRateValue != null ? formatRunHeartrate(heartRateValue) : null}
              unit={heartRateValue != null ? "bpm" : undefined}
              hint="The chart renders only when the local heart-rate stream or split rows contain a real series."
              chartValues={detail.heartrateSeries}
            />

            <section className="surface-slab rounded-[28px] px-5 py-5 md:px-6">
              <p className="section-kicker mb-2">Source</p>
              <h2 className="ink-safe text-[2rem] font-semibold tracking-[-0.05em] text-white">
                Local authority
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink-2)]">
                Strava remains authoritative for this run. If split rows or
                heart-rate streams have not been synced into SQLite yet, FarSygil
                leaves those surfaces empty instead of fabricating them.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function RunSummaryCell({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-black/10 px-4 py-4">
      <p className="section-kicker mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className="tabular-nums text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--ink-1)]">
          {value}
        </span>
        {unit ? (
          <span className="pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-3)]">
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}
