import { DASHBOARD_EMPTY_STATE_TEXT } from "@/components/dashboard/dashboard-types";

interface LastSyncedBadgeProps {
  label?: string;
  value: string | null;
  className?: string;
}

export function LastSyncedBadge({
  label = "Last sync",
  value,
  className = "",
}: LastSyncedBadgeProps) {
  return (
    <span
      className={`liquid-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-2)] ${className}`.trim()}
    >
      <span>{label}:</span>
      <span className="text-[var(--ink-1)]">
        {value ?? DASHBOARD_EMPTY_STATE_TEXT}
      </span>
    </span>
  );
}
