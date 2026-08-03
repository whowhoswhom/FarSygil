import type { DashboardMetricTone } from "@/components/dashboard/dashboard-types";
import { dashboardToneVars } from "@/components/dashboard/dashboard-theme";

interface MiniLineChartProps {
  values: number[];
  tone: DashboardMetricTone;
  className?: string;
}

function buildLinePath(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number) {
  const linePath = buildLinePath(values, width, height);
  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}

export function MiniLineChart({
  values,
  tone,
  className = "",
}: MiniLineChartProps) {
  // A single data point cannot form a trend line; requiring >= 2 points keeps
  // the chart honest and prevents a degenerate one-point line from implying a
  // trend that does not exist.
  if (values.length < 2) {
    return null;
  }

  const width = 240;
  const height = 72;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-full w-full ${className}`.trim()}
      style={dashboardToneVars(tone)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={buildAreaPath(values, width, height)} fill="var(--dashboard-tone-wash)" />
      <path
        d={buildLinePath(values, width, height)}
        fill="none"
        stroke="var(--dashboard-tone)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
