import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";

interface MiniBarChartProps {
  values: number[];
  tone: DashboardMetricTone;
  className?: string;
}

export function MiniBarChart({
  values,
  tone,
  className = "",
}: MiniBarChartProps) {
  if (values.length === 0) {
    return null;
  }

  const width = 240;
  const height = 72;
  const barGap = 4;
  const barWidth = Math.max(4, (width - barGap * (values.length - 1)) / values.length);
  const maxValue = Math.max(...values, 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-full w-full ${className}`.trim()}
      style={dashboardToneVars(tone)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {values.map((value, index) => {
        const normalizedHeight = Math.max(1, (Math.max(value, 0) / maxValue) * (height - 10));
        const x = index * (barWidth + barGap);
        const y = height - normalizedHeight;

        return (
          <rect
            key={`${index}-${value}`}
            x={x}
            y={y}
            width={barWidth}
            height={normalizedHeight}
            rx={barWidth / 2}
            fill="var(--dashboard-tone)"
            fillOpacity={0.9 - index * 0.015}
          />
        );
      })}
    </svg>
  );
}
