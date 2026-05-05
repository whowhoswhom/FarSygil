import { EffortGlow } from "@/components/activities/effort-glow";
import { LiquidSurface } from "@/components/activities/liquid-surface";
import { MetricRail } from "@/components/activities/metric-rail";
import { RoutePreview } from "@/components/activities/route-preview";
import { SportPill } from "@/components/activities/sport-pill";
import {
  formatActivityDate,
  heroRailMetricsFor,
  primaryMetricFor,
} from "@/lib/activities/format";
import type { ArchiveActivity } from "@/lib/activities/types";

export function MajorTile({ activity }: { activity: ArchiveActivity }) {
  const primaryMetric = primaryMetricFor(activity);
  const metrics = heroRailMetricsFor(activity).slice(0, 3);

  return (
    <LiquidSurface
      radius={28}
      className="archive-rise relative col-span-12 min-h-[360px] p-5 md:p-6 xl:col-span-6"
    >
      <EffortGlow activity={activity} edge="right" />
      <div className="mb-5 flex items-center justify-between gap-3">
        <SportPill sportType={activity.sportType} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
          {formatActivityDate(activity.startDate)}
        </span>
      </div>
      <div className="grid h-[calc(100%-2rem)] gap-5 md:grid-cols-[1.1fr_1fr]">
        <RoutePreview
          activityId={activity.id}
          pathData={activity.routePathData}
          className="h-[220px] w-full md:h-full"
        />
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="mb-4 text-[2rem] font-semibold leading-[0.92] tracking-[-0.05em] text-white">
              {activity.name ?? "Untitled effort"}
            </h3>
            <div className="mb-6 flex items-end gap-2">
              <span className="tabular-nums text-[3rem] font-semibold tracking-[-0.07em] text-white">
                {primaryMetric.value}
              </span>
              {primaryMetric.unit ? (
                <span className="pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-3)]">
                  {primaryMetric.unit}
                </span>
              ) : null}
            </div>
          </div>
          <MetricRail metrics={metrics} columns={3} />
        </div>
      </div>
    </LiquidSurface>
  );
}
