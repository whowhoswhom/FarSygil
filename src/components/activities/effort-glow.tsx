import { effortIntensity } from "@/lib/activities/format";
import type { ArchiveActivity } from "@/lib/activities/types";

export function EffortGlow({
  activity,
  edge = "right",
}: {
  activity: ArchiveActivity;
  edge?: "right" | "bottom";
}) {
  const intensity = effortIntensity(activity);

  if (intensity <= 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: 0.12 + intensity * 0.3,
        background:
          edge === "right"
            ? `linear-gradient(90deg, transparent 74%, rgba(168,226,108,${0.22 + intensity * 0.28}) 100%)`
            : `linear-gradient(180deg, transparent 74%, rgba(168,226,108,${0.22 + intensity * 0.28}) 100%)`,
      }}
    />
  );
}
