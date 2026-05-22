import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { AppIcon } from "@/components/app-shell/app-icons";
import type { AppIconName } from "@/components/app-shell/app-icons";
import { MiniLineChart } from "@/components/dashboard/mini-line-chart";

import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

interface HealthClusterMetric {
  label: string;
  tone: DashboardMetricTone;
  icon: AppIconName;
  value?: string;
  unit?: string;
  chartValues?: number[];
}

export function DashboardHealthClusterCard({
  title,
  sourceLabel,
  metrics,
  hint,
}: {
  title: string;
  sourceLabel: string;
  metrics: HealthClusterMetric[];
  hint: string;
}) {
  return (
    <article className="dashboard-shell-card p-4 md:p-5">
      <div className="relative flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <MetricIconBadge tone="recovery" icon="health" />
              <h3 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white">
                {title}
              </h3>
            </div>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{sourceLabel}</p>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--metric-cardio)]">
            <AppIcon name="health" className="text-base" />
          </span>
        </div>

        <div className="dashboard-mock-empty grid grid-cols-5 gap-2 p-3">
          {metrics.map((metric, index) => {
            const hasChart =
              Array.isArray(metric.chartValues) && metric.chartValues.length >= 2;

            return (
              <div key={metric.label} className="relative flex min-w-0 flex-col gap-2">
                {index < metrics.length - 1 ? (
                  <div className="dashboard-stat-divider absolute right-0 top-0 h-full" />
                ) : null}
                <div className="flex items-center gap-1.5">
                  <MetricIconBadge tone={metric.tone} icon={metric.icon} size="sm" />
                  <span className="truncate text-[0.68rem] font-medium text-[var(--ink-2)] md:text-xs">
                    {metric.label}
                  </span>
                </div>
                <div className="flex items-end gap-1 pl-1">
                  <span className="dashboard-tile-value text-[1.35rem] font-semibold text-white/80 md:text-[1.65rem]">
                    {metric.value ?? "--"}
                  </span>
                  {metric.unit ? (
                    <span className="pb-0.5 text-[0.65rem] text-[var(--ink-3)] md:text-xs">{metric.unit}</span>
                  ) : null}
                </div>
                {hasChart ? (
                  <div className="mt-auto h-9 pl-1 pr-2">
                    <MiniLineChart values={metric.chartValues ?? []} tone={metric.tone} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="text-xs leading-relaxed text-[var(--ink-3)]">{hint}</p>
      </div>
    </article>
  );
}
