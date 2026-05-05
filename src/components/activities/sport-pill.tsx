import { sportLabel } from "@/lib/activities/format";

export function SportPill({ sportType }: { sportType: string | null }) {
  return (
    <span
      className="rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
      style={{
        color: "var(--accent-bright)",
        background: "rgba(123, 194, 65, 0.1)",
        border: "1px solid rgba(168, 226, 108, 0.22)",
        boxShadow: "0 0 20px -12px var(--accent-glow)",
      }}
    >
      {sportLabel(sportType)}
    </span>
  );
}
