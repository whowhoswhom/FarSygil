import { IndoorArtwork } from "@/components/activities/indoor-artwork";

interface RoutePreviewProps {
  activityId: number;
  pathData: string | null;
  className?: string;
  compact?: boolean;
  animate?: boolean;
}

export function RoutePreview({
  activityId,
  pathData,
  className = "",
  compact = false,
  animate = false,
}: RoutePreviewProps) {
  const gradientId = `route-gradient-${activityId}`;
  const glowId = `route-glow-${activityId}`;

  if (!pathData) {
    return (
      <div
        className={`relative overflow-hidden rounded-[22px] border border-white/6 bg-black/10 ${className}`.trim()}
      >
        <IndoorArtwork compact={compact} />
        <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55 backdrop-blur-md">
          Indoor / no GPS
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border border-white/6 bg-black/10 ${className}`.trim()}
    >
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-bright)" />
            <stop offset="55%" stopColor="var(--accent-core)" />
            <stop offset="100%" stopColor="var(--accent-deep)" />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={compact ? 2 : 3} />
          </filter>
        </defs>
        <path
          d={pathData}
          fill="none"
          stroke={`url(#${gradientId})`}
          opacity="0.55"
          strokeWidth={compact ? 4.2 : 5}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
        <path
          d={pathData}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={compact ? 1.9 : 2.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className={animate ? "route-draw" : undefined}
        />
      </svg>
    </div>
  );
}
