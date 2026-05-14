import { SourceLabel } from "@/components/dashboard";
import { AppIcon } from "@/components/app-shell/app-icons";
import { RoutePreview } from "@/components/activities/route-preview";

import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";
import { RunStatStrip } from "@/components/visual-reboot/run-stat-strip";

export function RunDetailHero({
  title,
  statusLabel,
  sourceDateLabel,
  sourceTimeLabel,
  distanceChipLabel,
  pathData,
  activityId,
  statItems,
}: {
  title: string;
  statusLabel: string;
  sourceDateLabel: string;
  sourceTimeLabel?: string;
  distanceChipLabel?: string;
  pathData: string | null;
  activityId: number;
  statItems: Array<{
    label: string;
    value: string;
    unit?: string;
    toneVar?: string;
  }>;
}) {
  return (
    <section className="flex flex-col gap-6">
      <article className="dashboard-shell-card p-5 md:p-6">
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <MetricIconBadge tone="exercise" icon="run" size="lg" />
              <div className="min-w-0">
                <h1 className="text-[2.8rem] font-semibold leading-[0.94] tracking-[-0.06em] text-white md:text-[4.2rem]">
                  {title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,244,61,0.18)] bg-[rgba(167,244,61,0.1)] px-3 py-1 text-sm font-medium text-[var(--accent-bright)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-bright)]" />
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-start gap-3 md:items-end">
              <SourceLabel source="Strava" tone="exercise" />
              <div className="text-left text-[1.1rem] leading-snug text-[var(--ink-2)] md:text-right">
                <p>{sourceDateLabel}</p>
                {sourceTimeLabel ? <p>{sourceTimeLabel}</p> : null}
              </div>
            </div>
          </div>

          <RunStatStrip items={statItems} />
        </div>
      </article>

      <RoutePreview
        activityId={activityId}
        pathData={pathData}
        className="min-h-[320px] w-full rounded-[28px] md:min-h-[420px]"
        chipLabel={distanceChipLabel}
      />
    </section>
  );
}
