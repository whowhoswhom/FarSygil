import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";
import { EmptyMetricState } from "@/components/dashboard/empty-metric-state";
import { MiniLineChart } from "@/components/dashboard/mini-line-chart";
import type { AppIconName } from "@/components/app-shell/app-icons";

import { MetricIconBadge } from "@/components/visual-reboot/icon-badge";

export function RunChartTile({
  title,
  tone,
  icon,
  value,
  unit,
  chartValues,
  guideLabels = [],
  hint,
}: {
  title: string;
  tone: DashboardMetricTone;
  icon: AppIconName;
  value: string | null;
  unit?: string;
  chartValues: number[];
  guideLabels?: string[];
  hint?: string;
}) {
  return (
    <article className="dashboard-shell-card p-4 md:p-5" style={dashboardToneVars(tone)}>
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-center gap-3">
          <MetricIconBadge tone={tone} icon={icon} />
          <h3 className="text-[1.45rem] font-medium tracking-[-0.04em] text-white md:text-[1.7rem]">
            {title}
          </h3>
        </div>

        {value ? (
          <>
            <div className="flex items-end gap-2">
              <span
                className="dashboard-tile-value text-[2.45rem] font-semibold md:text-[3rem]"
                style={{ color: "var(--dashboard-tone)" }}
              >
                {value}
              </span>
              {unit ? (
                <span className="pb-1 text-[1.15rem] font-medium text-[var(--ink-2)]">
                  {unit}
                </span>
              ) : null}
            </div>
            <div className="grid min-h-[5.2rem] gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="rounded-[16px] border border-white/6 bg-black/10 px-2 py-2">
                {chartValues.length > 0 ? (
                  <MiniLineChart values={chartValues} tone={tone} />
                ) : (
                  <div className="h-[3.5rem]" />
                )}
              </div>
              {guideLabels.length > 0 ? (
                <div className="flex flex-row gap-3 text-sm text-[var(--ink-3)] sm:flex-col sm:items-end">
                  {guideLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="my-auto">
            <EmptyMetricState
              label={title}
              hint={hint}
              compact
              showLabel={false}
            />
          </div>
        )}
      </div>
    </article>
  );
}
