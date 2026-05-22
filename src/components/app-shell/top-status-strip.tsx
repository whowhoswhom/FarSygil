import Link from "next/link";

import { LastSyncedBadge, StatusBadge } from "@/components/dashboard";

interface TopStatusStripProps {
  stravaLabel: string;
  stravaState: "connected" | "disconnected" | "pending" | "unavailable";
  healthLabel: string;
  healthState: "connected" | "disconnected" | "pending" | "unavailable";
  lastSyncedLabel: string | null;
}

export function TopStatusStrip({
  stravaLabel,
  stravaState,
  healthLabel,
  healthState,
  lastSyncedLabel,
}: TopStatusStripProps) {
  return (
    <div className="surface-slab app-top-strip">
      <div className="flex items-center justify-between gap-3 overflow-hidden">
        <div className="flex min-w-0 items-center gap-2">
          <StatusBadge label={stravaLabel} state={stravaState} />
          <StatusBadge
            label={healthLabel}
            state={healthState}
            className="hidden sm:inline-flex"
          />
          <LastSyncedBadge label="Last synced" value={lastSyncedLabel} />
        </div>
        <div className="hidden flex-none items-center gap-2 2xl:flex">
          <Link
            href="/connect"
            className="ghost-button inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium"
          >
            Manage sync
          </Link>
          <Link
            href="/settings"
            className="ghost-button inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
