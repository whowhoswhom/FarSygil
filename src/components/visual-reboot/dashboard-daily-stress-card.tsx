import Link from "next/link";

import { AppIcon } from "@/components/app-shell/app-icons";
import { EmptyMetricState } from "@/components/dashboard/empty-metric-state";
import { MiniLineChart } from "@/components/dashboard/mini-line-chart";
import { SourceLabel } from "@/components/dashboard";
import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

interface DailyStressPoint {
  date: string;
  dailyTrainingStress: number;
}

export function DashboardDailyStressCard({
  latest,
  series,
  href = "/training-load",
}: {
  latest: DailyStressPoint | null;
  series: DailyStressPoint[];
  href?: string;
}) {
  const chartValues = series.map((point) => point.dailyTrainingStress);

  return (
    <article className="dashboard-shell-card p-4 md:p-5">
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MetricIconBadge tone="trend" icon="load" />
            <div>
              <h3 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white">
                Daily Stress
              </h3>
              <SourceLabel source="Derived" tone="trend" compact />
            </div>
          </div>
          <Link
            href={href}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)] hover:text-white"
            aria-label="Open Training Load"
          >
            <AppIcon name="arrow-right" className="text-base" />
          </Link>
        </div>

        {latest ? (
          <>
            <div className="mt-auto flex items-end gap-1.5">
              <span className="dashboard-tile-value text-[2.6rem] font-semibold text-[var(--metric-trend)]">
                {formatStress(latest.dailyTrainingStress)}
              </span>
              <span className="pb-1 text-sm font-medium text-[var(--ink-2)]">
                stress
              </span>
            </div>
            <p className="text-xs text-[var(--ink-3)]">
              Latest computed day: {latest.date}
            </p>
            <div className="h-24 rounded-[14px] border border-white/6 bg-black/10 px-2 py-2">
              {chartValues.length >= 2 ? (
                <MiniLineChart values={chartValues} tone="trend" />
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs leading-relaxed text-[var(--ink-3)]">
                  Trend requires at least two real computed days.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="my-auto">
            <EmptyMetricState
              label="Daily Stress"
              hint="Data not available until /training-load computes daily stress from real local Strava runs."
              compact
              showLabel={false}
            />
          </div>
        )}
      </div>
    </article>
  );
}

function formatStress(value: number): string {
  return value >= 100 ? value.toFixed(0) : value.toFixed(1);
}
