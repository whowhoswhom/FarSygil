import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { AppIcon } from "@/components/app-shell/app-icons";
import type { AppIconName } from "@/components/app-shell/app-icons";

import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

interface HealthClusterMetric {
  label: string;
  tone: DashboardMetricTone;
  icon: AppIconName;
  value?: string;
  unit?: string;
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
    <article className="dashboard-shell-card p-5 md:p-6">
      <div className="relative flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <MetricIconBadge tone="recovery" icon="health" />
              <h3 className="text-[2rem] font-semibold tracking-[-0.045em] text-white">
                {title}
              </h3>
            </div>
            <p className="mt-2 text-base text-[var(--ink-2)]">{sourceLabel}</p>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--metric-cardio)]">
            <AppIcon name="health" className="text-xl" />
          </span>
        </div>

        <div className="dashboard-mock-empty grid gap-4 p-4 md:grid-cols-5">
          {metrics.map((metric, index) => (
            <div key={metric.label} className="relative flex flex-col gap-3">
              {index < metrics.length - 1 ? (
                <div className="dashboard-stat-divider absolute right-0 top-0 hidden h-full md:block" />
              ) : null}
              <div className="flex items-center gap-3">
                <MetricIconBadge tone={metric.tone} icon={metric.icon} size="sm" />
                <span className="text-sm font-medium text-[var(--ink-2)]">{metric.label}</span>
              </div>
              <div className="flex items-end gap-2 pl-1">
                <span className="dashboard-tile-value text-[2rem] font-semibold text-white/80">
                  {metric.value ?? "--"}
                </span>
                {metric.unit ? (
                  <span className="pb-1 text-sm text-[var(--ink-3)]">{metric.unit}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-[var(--ink-3)]">{hint}</p>
      </div>
    </article>
  );
}
