import type { DashboardRangeValue } from "@/components/dashboard/dashboard-types";

interface TimeRangeToggleProps {
  options?: readonly DashboardRangeValue[];
  activeValue: DashboardRangeValue;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_OPTIONS: readonly DashboardRangeValue[] = ["D", "W", "M", "Y"];

export function TimeRangeToggle({
  options = DEFAULT_OPTIONS,
  activeValue,
  disabled = false,
  className = "",
}: TimeRangeToggleProps) {
  return (
    <div
      className={`liquid-pill inline-flex items-center rounded-full p-1 ${className}`.trim()}
      role="tablist"
      aria-label="Dashboard time range"
      aria-disabled={disabled}
    >
      {options.map((option) => {
        const isActive = option === activeValue;

        return (
          <button
            key={option}
            type="button"
            role="tab"
            disabled={disabled}
            aria-selected={isActive}
            className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.22em] uppercase transition ${
              isActive
                ? "bg-[var(--accent-core)] text-[#071005] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_12px_24px_-18px_var(--accent-glow)]"
                : "text-[var(--ink-3)] hover:text-[var(--ink-1)]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
