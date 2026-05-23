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
    <section className="flex flex-col gap-4">
      <article className="dashboard-shell-card p-4 md:p-5">
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              <MetricIconBadge tone="exercise" icon="run" size="lg" />
              <div className="min-w-0">
                <h1 className="text-[2.35rem] font-semibold leading-[0.94] tracking-[-0.06em] text-white md:text-[3.35rem]">
                  {title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(167,244,61,0.18)] bg-[rgba(167,244,61,0.1)] px-3 py-1 text-sm font-medium text-[var(--accent-bright)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-bright)]" />
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-start gap-2 md:items-end">
              <SourceLabel source="Strava" tone="exercise" />
              <div className="text-left text-sm leading-snug text-[var(--ink-2)] md:text-right md:text-base">
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
        className="min-h-[250px] w-full rounded-[26px] md:min-h-[320px]"
        chipLabel={distanceChipLabel}
      />
    </section>
  );
}
