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
    <article className="dashboard-shell-card p-5 md:p-6">
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <MetricIconBadge tone="trend" icon="load" />
            <div>
              <h3 className="text-[2rem] font-semibold tracking-[-0.045em] text-white">
                Daily Stress
              </h3>
              <SourceLabel source="Derived" tone="trend" compact />
            </div>
          </div>
          <Link
            href={href}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)] hover:text-white"
            aria-label="Open Training Load"
          >
            <AppIcon name="arrow-right" className="text-xl" />
          </Link>
        </div>

        {latest ? (
          <>
            <div className="mt-auto flex items-end gap-2">
              <span className="dashboard-tile-value text-[3.4rem] font-semibold text-[var(--metric-trend)]">
                {formatStress(latest.dailyTrainingStress)}
              </span>
              <span className="pb-1 text-[1.15rem] font-medium text-[var(--ink-2)]">
                stress
              </span>
            </div>
            <p className="text-sm text-[var(--ink-3)]">
              Latest computed day: {latest.date}
            </p>
            <div className="min-h-[4.75rem] rounded-[16px] border border-white/6 bg-black/10 px-2 py-2">
              {chartValues.length >= 2 ? (
                <MiniLineChart values={chartValues} tone="trend" />
              ) : (
                <div className="flex h-[4.25rem] items-center justify-center text-center text-xs leading-relaxed text-[var(--ink-3)]">
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
