import Link from "next/link";

import { LastSyncedBadge, StatusBadge } from "@/components/dashboard";

interface TopStatusStripProps {
  stravaLabel: string;
  stravaState: "connected" | "disconnected" | "pending" | "unavailable";
  lastSyncedLabel: string | null;
}

export function TopStatusStrip({
  stravaLabel,
  stravaState,
  lastSyncedLabel,
}: TopStatusStripProps) {
  return (
    <div className="surface-slab app-top-strip">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label={stravaLabel} state={stravaState} />
          <StatusBadge label="Health import pending" state="unavailable" />
          <LastSyncedBadge label="Last synced" value={lastSyncedLabel} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/connect"
            className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
          >
            Manage sync
          </Link>
          <Link
            href="/settings"
            className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
