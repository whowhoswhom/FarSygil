import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";
import { EmptyMetricState } from "@/components/dashboard/empty-metric-state";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { MiniLineChart } from "@/components/dashboard/mini-line-chart";
import { SourceLabel } from "@/components/dashboard/source-label";

interface MetricCardProps {
  title: string;
  tone: DashboardMetricTone;
  source?: string;
  value?: string | null;
  unit?: string;
  hint?: string;
  detail?: string;
  chartType?: "bar" | "line";
  chartValues?: number[];
  className?: string;
}

export function MetricCard({
  title,
  tone,
  source,
  value,
  unit,
  hint,
  detail,
  chartType = "line",
  chartValues = [],
  className = "",
}: MetricCardProps) {
  const hasValue = Boolean(value);
  const chart =
    chartValues.length > 0
      ? chartType === "bar"
        ? <MiniBarChart values={chartValues} tone={tone} />
        : <MiniLineChart values={chartValues} tone={tone} />
      : null;

  return (
    <article
      className={`surface-slab relative flex min-h-[260px] flex-col gap-5 rounded-[24px] p-6 ${className}`.trim()}
      style={dashboardToneVars(tone)}
    >
      <div className="dashboard-card-accent" />
      <div className="surface-rim" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="dashboard-accent-orb" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="dashboard-card-title">{title}</span>
            {source ? <SourceLabel source={source} tone={tone} compact /> : null}
          </div>
        </div>
        {detail ? (
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--ink-3)]">
            {detail}
          </span>
        ) : null}
      </div>
      <div className="relative flex flex-1 flex-col justify-between gap-5">
        {hasValue ? (
          <>
            <div className="flex items-end gap-3">
              <span className="dashboard-metric-value" style={{ color: "var(--dashboard-tone)" }}>
                {value}
              </span>
              {unit ? (
                <span className="pb-1 text-lg font-medium text-[var(--ink-2)]">
                  {unit}
                </span>
              ) : null}
            </div>
            {hint ? <p className="dashboard-surface-note">{hint}</p> : null}
            {chart ? <div className="dashboard-chart-frame">{chart}</div> : null}
          </>
        ) : (
          <EmptyMetricState
            label={title}
            hint={hint}
            compact
            showLabel={false}
            className="my-auto"
          />
        )}
      </div>
    </article>
  );
}
