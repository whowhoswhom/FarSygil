import { DASHBOARD_EMPTY_STATE_TEXT } from "@/components/dashboard/dashboard-types";

interface EmptyMetricStateProps {
  label: string;
  hint?: string;
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function EmptyMetricState({
  label,
  hint,
  compact = false,
  showLabel = true,
  className = "",
}: EmptyMetricStateProps) {
  return (
    <div
      className={`flex flex-col ${compact ? "gap-2" : "gap-3"} ${className}`.trim()}
    >
      {showLabel ? (
        <span className={compact ? "sr-only" : "section-kicker"}>{label}</span>
      ) : null}
      <div className="flex flex-col gap-2">
        <p
          className={
            compact
              ? "text-base font-semibold text-[var(--ink-1)]"
              : "text-xl font-semibold text-[var(--ink-1)]"
          }
        >
          {DASHBOARD_EMPTY_STATE_TEXT}
        </p>
        {hint ? <p className="dashboard-surface-note">{hint}</p> : null}
      </div>
    </div>
  );
}
