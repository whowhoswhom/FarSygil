import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";

interface SourceLabelProps {
  source: string;
  tone?: DashboardMetricTone;
  compact?: boolean;
  className?: string;
}

export function SourceLabel({
  source,
  tone = "neutral",
  compact = false,
  className = "",
}: SourceLabelProps) {
  const sizeClass = compact ? "px-2.5 py-1" : "px-3 py-1.5";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 ${sizeClass} text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-2)] backdrop-blur-md ${className}`.trim()}
      style={dashboardToneVars(tone)}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--dashboard-tone)" }}
      />
      <span>{source}</span>
    </span>
  );
}
