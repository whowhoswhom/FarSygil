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

export function HeroTile({ activity }: { activity: ArchiveActivity }) {
  const primaryMetric = primaryMetricFor(activity);
  const railMetrics = heroRailMetricsFor(activity);

  return (
    <section className="mb-10">
      <LiquidSurface
        depth="hero"
        radius={34}
        className="archive-rise min-h-[72svh] px-6 py-6 md:px-10 md:py-10"
      >
        <EffortGlow activity={activity} edge="right" />
        <div className="absolute inset-0 opacity-70">
          <RoutePreview
            activityId={activity.id}
            pathData={activity.routePathData}
            animate
            framed={false}
            className="h-full w-full rounded-[28px]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-[rgba(5,7,5,0.94)]" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="liquid-pill px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
              Most recent
            </span>
            <SportPill sportType={activity.sportType} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
              {formatActivityDate(activity.startDate)}
            </span>
          </div>
          <div className="max-w-5xl">
            <p className="mb-4 max-w-2xl text-sm text-[var(--ink-2)] md:text-base">
              The archive opens on your latest real effort.
            </p>
            <h1
              className="ink-safe mb-8 max-w-5xl text-[3rem] font-semibold leading-[0.86] tracking-[-0.065em] text-white md:text-[5rem] xl:text-[6.75rem]"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              {activity.name ?? "Untitled effort"}
            </h1>
            <div className="mb-10 flex flex-wrap items-end gap-3">
              <span
                className="hero-metric tabular-nums"
                style={{ fontSize: "clamp(96px, 12vw, 192px)" }}
              >
                {primaryMetric.value}
              </span>
              {primaryMetric.unit ? (
                <span className="pb-4 text-sm font-semibold uppercase tracking-[0.26em] text-[var(--ink-3)] md:text-base">
                  {primaryMetric.unit}
                </span>
              ) : null}
            </div>
            <MetricRail metrics={railMetrics} columns={4} />
          </div>
        </div>
      </LiquidSurface>
    </section>
  );
}
