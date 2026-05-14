import type { CSSProperties } from "react";

import { IndoorArtwork } from "@/components/activities/indoor-artwork";

interface RoutePreviewProps {
  activityId: number;
  pathData: string | null;
  className?: string;
  compact?: boolean;
  animate?: boolean;
  framed?: boolean;
  chipLabel?: string;
}

export function RoutePreview({
  activityId,
  pathData,
  className = "",
  compact = false,
  animate = false,
  framed = true,
  chipLabel,
}: RoutePreviewProps) {
  const gradientId = `route-gradient-${activityId}`;
  const glowId = `route-glow-${activityId}`;
  const frameClass = framed
    ? "faux-map-frame rounded-[22px]"
    : "rounded-[inherit] border-0 bg-transparent";

  if (!pathData) {
    return (
      <div
        className={`relative overflow-hidden ${frameClass} ${className}`.trim()}
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
      className={`relative overflow-hidden ${frameClass} ${className}`.trim()}
    >
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D3FF6A" />
            <stop offset="52%" stopColor="var(--metric-exercise)" />
            <stop offset="100%" stopColor="#6CD11E" />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={compact ? 2 : 3} />
          </filter>
        </defs>
        <path
          d={pathData}
          fill="none"
          stroke="rgba(8, 12, 16, 0.42)"
          strokeWidth={compact ? 6.4 : 7.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
        <circle cx="32" cy="162" r={compact ? 5 : 6.5} fill="#071005" opacity="0.95" />
        <circle cx="32" cy="162" r={compact ? 3 : 4.25} fill="var(--metric-exercise)" />
        <circle cx="166" cy="42" r={compact ? 6 : 8} fill="#071005" opacity="0.92" />
        <circle cx="166" cy="42" r={compact ? 4 : 5.5} fill="#F7FBF0" />
        <circle cx="166" cy="42" r={compact ? 2.5 : 3.25} fill="var(--metric-exercise)" />
      </svg>
      {chipLabel ? (
        <div className="faux-map-chip">
          <div
            className="dashboard-icon-badge"
            style={
              {
                "--dashboard-tone": "var(--metric-exercise)",
                "--dashboard-tone-wash": "var(--metric-exercise-wash)",
              } as CSSProperties
            }
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M6 16L9 11L12.5 12.5L15.5 8L18 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8.5 7.5A1.75 1.75 0 108.5 4a1.75 1.75 0 000 3.5z" fill="currentColor" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="faux-map-chip-value">{chipLabel}</span>
            <span className="faux-map-chip-label">Route detail</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
