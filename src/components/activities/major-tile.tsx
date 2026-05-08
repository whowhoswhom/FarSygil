import { EffortGlow } from "@/components/activities/effort-glow";
import { LiquidSurface } from "@/components/activities/liquid-surface";
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
      className="archive-rise relative col-span-12 min-h-[420px] xl:col-span-6"
    >
      <EffortGlow activity={activity} edge="right" />
      <div className="absolute inset-x-0 top-0 h-[52%] overflow-hidden rounded-t-[28px]">
        <RoutePreview
          activityId={activity.id}
          pathData={activity.routePathData}
          framed={false}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-[rgba(5,7,5,0.88)]" />
        <div className="absolute left-5 right-5 top-5 flex items-start justify-between gap-3 md:left-6 md:right-6">
          <SportPill sportType={activity.sportType} />
          <span className="text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
            {formatActivityDate(activity.startDate)}
          </span>
        </div>
      </div>
      <div className="relative z-10 flex min-h-[420px] flex-col justify-end p-5 md:p-6">
        <div className="max-w-3xl">
          <h3 className="ink-safe mb-4 text-[2rem] font-semibold leading-[0.92] tracking-[-0.05em] text-white md:text-[2.2rem]">
            {activity.name ?? "Untitled effort"}
          </h3>
          <div className="mb-6 flex flex-wrap items-end gap-3">
            <span className="hero-metric tabular-nums text-[3.5rem] md:text-[4.75rem]">
              {primaryMetric.value}
            </span>
            {primaryMetric.unit ? (
              <span className="pb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)] md:text-sm">
                {primaryMetric.unit}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {metrics.map((metric) => (
            <div
              key={`${metric.label}-${metric.value}-${metric.unit ?? ""}`}
              className="min-w-[140px] flex-1 rounded-[18px] border border-white/6 bg-black/10 px-4 py-4 backdrop-blur-sm"
            >
              <p className="section-kicker mb-2">{metric.label}</p>
              <div className="flex items-end gap-1">
                <span className="tabular-nums text-[1.375rem] font-semibold tracking-[-0.04em] text-[var(--ink-1)]">
                  {metric.value}
                </span>
                {metric.unit ? (
                  <span className="pb-1 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--ink-3)]">
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
