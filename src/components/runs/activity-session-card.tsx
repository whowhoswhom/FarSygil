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
      className="surface-slab archive-rise group block rounded-[24px] px-4 py-4"
    >
      <div className="surface-rim" />
      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
        <RoutePreview
          activityId={activity.id}
          pathData={activity.routePathData}
          compact
          className="h-[128px] w-full rounded-[18px] md:h-[140px]"
        />

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <SportPill sportType={activity.sportType} />
                <SourceLabel source="Strava" tone="exercise" compact />
              </div>
              <h2 className="ink-safe line-clamp-2 text-[1.55rem] font-semibold leading-[0.95] tracking-[-0.05em] text-white md:text-[1.9rem]">
                {activity.name ?? "Untitled run"}
              </h2>
            </div>
            <p className="text-right text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
              {formatRunDate(activity.startDateLocal ?? activity.startDate)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-2)] md:text-sm">
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
    <div className="rounded-[14px] border border-white/6 bg-black/10 px-3 py-2.5">
      <p className="section-kicker mb-1">{label}</p>
      <p className="tabular-nums text-sm font-semibold tracking-[-0.04em] text-[var(--ink-1)] md:text-base">
        {value}
      </p>
    </div>
  );
}
