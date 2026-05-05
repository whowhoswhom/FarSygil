export function IndoorArtwork({ compact = false }: { compact?: boolean }) {
  const rings = compact ? [48, 66, 84] : [36, 56, 78, 102];

  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`indoor-gradient-${compact ? "compact" : "full"}`}>
          <stop offset="0%" stopColor="var(--accent-bright)" />
          <stop offset="100%" stopColor="var(--accent-deep)" />
        </linearGradient>
      </defs>
      {rings.map((radius, index) => (
        <circle
          key={radius}
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={`url(#indoor-gradient-${compact ? "compact" : "full"})`}
          strokeWidth={index === 1 ? 1.4 : 0.8}
          strokeDasharray={index % 2 === 0 ? "0" : "2.5 7"}
          opacity={0.18 + (rings.length - index) * 0.08}
        />
      ))}
      <circle cx="100" cy="100" r="3" fill="var(--accent-bright)" />
    </svg>
  );
}
