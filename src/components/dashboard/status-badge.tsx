import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";

type StatusState = "connected" | "disconnected" | "pending" | "unavailable";

interface StatusBadgeProps {
  label: string;
  state: StatusState;
  className?: string;
}

const STATE_TO_TONE: Record<StatusState, Parameters<typeof dashboardToneVars>[0]> =
  {
    connected: "exercise",
    disconnected: "warning",
    pending: "time",
    unavailable: "neutral",
  };

export function StatusBadge({
  label,
  state,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`liquid-pill inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-1)] ${className}`.trim()}
      style={dashboardToneVars(STATE_TO_TONE[state])}
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rounded-full"
        style={{
          background: "var(--dashboard-tone)",
          boxShadow: "0 0 0 6px var(--dashboard-tone-wash)",
        }}
      />
      <span>{label}</span>
    </span>
  );
}
