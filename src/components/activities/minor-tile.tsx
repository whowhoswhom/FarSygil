import { EffortGlow } from "@/components/activities/effort-glow";
import { LiquidSurface } from "@/components/activities/liquid-surface";
import { RoutePreview } from "@/components/activities/route-preview";
import { SportPill } from "@/components/activities/sport-pill";
import {
  formatActivityDate,
  metricsFor,
  primaryMetricFor,
} from "@/lib/activities/format";
import type { ArchiveActivity } from "@/lib/activities/types";

export function MinorTile({ activity }: { activity: ArchiveActivity }) {
  const primaryMetric = primaryMetricFor(activity);
  const metrics = metricsFor(activity);

  return (
    <LiquidSurface
      radius={24}
      className="archive-rise relative col-span-12 min-h-[300px] p-5 md:col-span-6 xl:col-span-4"
    >
      <EffortGlow activity={activity} edge="bottom" />
      <div className="mb-5 flex items-start justify-between gap-4">
        <SportPill sportType={activity.sportType} />
        <span className="text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
          {formatActivityDate(activity.startDate)}
        </span>
      </div>
      <RoutePreview
        activityId={activity.id}
        pathData={activity.routePathData}
        compact
        className="mb-5 h-[144px] w-full"
      />
      <div className="space-y-4">
        <h3 className="line-clamp-2 text-[1.55rem] font-semibold leading-[0.95] tracking-[-0.045em] text-white">
          {activity.name ?? "Untitled effort"}
        </h3>
        <div className="flex items-end gap-2">
          <span className="ink-safe tabular-nums text-[2.6rem] font-semibold tracking-[-0.07em] text-white">
            {primaryMetric.value}
          </span>
          {primaryMetric.unit ? (
            <span className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-3)]">
              {primaryMetric.unit}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {metrics.map((metric) => (
            <div key={`${metric.label}-${metric.value}`}>
              <p className="section-kicker mb-1">{metric.label}</p>
              <div className="flex items-end gap-1">
                <span className="tabular-nums text-lg font-semibold tracking-[-0.04em] text-[var(--ink-1)]">
                  {metric.value}
                </span>
                {metric.unit ? (
                  <span className="pb-[2px] text-[10px] uppercase tracking-[0.16em] text-[var(--ink-3)]">
                    {metric.unit}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </LiquidSurface>
  );
}
