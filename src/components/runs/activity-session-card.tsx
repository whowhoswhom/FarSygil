import Link from "next/link";

import { RoutePreview } from "@/components/activities/route-preview";
import { SportPill } from "@/components/activities/sport-pill";
import { SourceLabel } from "@/components/dashboard";
import {
  formatRunDate,
  formatRunDistance,
  formatRunDurationShort,
  formatRunElevationFeet,
  formatRunHeartrate,
  formatRunPaceFromActivity,
} from "@/lib/runs/format";
import type { ArchiveActivity } from "@/lib/activities/types";

export function ActivitySessionCard({
  activity,
}: {
  activity: ArchiveActivity;
}) {
  const pace = formatRunPaceFromActivity(activity);
  const elevation = formatRunElevationFeet(activity.totalElevationGain);

  return (
    <Link
      href={`/runs/${activity.id}`}
      className="surface-slab archive-rise group block rounded-[28px] px-5 py-5 md:px-6"
    >
      <div className="surface-rim" />
      <div className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
        <RoutePreview
          activityId={activity.id}
          pathData={activity.routePathData}
          compact
          className="h-[180px] w-full rounded-[22px]"
        />

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <SportPill sportType={activity.sportType} />
                <SourceLabel source="Strava" tone="exercise" compact />
              </div>
              <h2 className="ink-safe line-clamp-2 text-[2rem] font-semibold leading-[0.92] tracking-[-0.05em] text-white md:text-[2.3rem]">
                {activity.name ?? "Untitled run"}
              </h2>
            </div>
            <p className="text-right text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
              {formatRunDate(activity.startDateLocal ?? activity.startDate)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <RunMetricCell
              label="Distance"
              value={formatRunDistance(activity.distanceMeters)}
            />
            <RunMetricCell
              label="Moving"
              value={formatRunDurationShort(activity.movingTimeSeconds)}
            />
            <RunMetricCell
              label="Pace"
              value={pace ? `${pace} /mi` : "--"}
            />
            <RunMetricCell
              label="Avg HR"
              value={
                activity.averageHeartrate != null
                  ? `${formatRunHeartrate(activity.averageHeartrate)} bpm`
                  : "--"
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--ink-2)]">
            <p>
              Elevation{" "}
              <span className="text-[var(--ink-1)]">
                {elevation === "--" ? elevation : `${elevation} ft`}
              </span>
            </p>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)] group-hover:text-[var(--accent-bright)]">
              Open run
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function RunMetricCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-4">
      <p className="section-kicker mb-2">{label}</p>
      <p className="tabular-nums text-lg font-semibold tracking-[-0.04em] text-[var(--ink-1)]">
        {value}
      </p>
    </div>
  );
}
