import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { activities } from "@/db/schema";
import { getStravaConnectionStatus } from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatExpiry(expiresAt: number | null): string {
  if (!expiresAt) {
    return "--";
  }

  try {
    return new Date(expiresAt * 1000).toLocaleString();
  } catch {
    return "--";
  }
}

export default async function ConnectPage() {
  const status = await getStravaConnectionStatus(db);
  const [latestActivity] = await db
    .select({
      name: activities.name,
      startDate: activities.startDate,
    })
    .from(activities)
    .orderBy(desc(activities.startDate))
    .limit(1);

  return (
    <main className="page-shell min-h-screen px-6 py-16 text-[var(--ink-1)] md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <Link href="/" className="text-sm text-[var(--ink-3)] hover:text-[var(--ink-1)]">
            {"<- Back"}
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Connect Strava
          </h1>
          <p className="mt-2 text-[var(--ink-2)]">
            Authorize FarSygil to read your activity data. Tokens are stored
            locally in <code className="text-white">data/running.db</code>.
          </p>
        </div>

        <section className="rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Connection status
            </h2>
            <StatusBadge connected={status.connected} expired={status.expired} />
          </div>

          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-[var(--ink-3)]">Athlete ID</dt>
            <dd className="text-[var(--ink-1)]">
              {status.athleteId ?? <span className="text-[var(--ink-3)]">--</span>}
            </dd>

            <dt className="text-[var(--ink-3)]">Scope</dt>
            <dd className="text-[var(--ink-1)]">
              {status.scope ?? <span className="text-[var(--ink-3)]">--</span>}
            </dd>

            <dt className="text-[var(--ink-3)]">Token expires</dt>
            <dd className="text-[var(--ink-1)]">
              {status.connected ? formatExpiry(status.expiresAt) : "--"}
            </dd>

            <dt className="text-[var(--ink-3)]">Last updated</dt>
            <dd className="text-[var(--ink-1)]">
              {status.updatedAt ?? <span className="text-[var(--ink-3)]">--</span>}
            </dd>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/strava/connect"
              className="accent-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
            >
              {status.connected ? "Reconnect Strava" : "Connect Strava"}
            </a>
            <Link
              href="/activities"
              className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Open Archive
            </Link>
          </div>
        </section>

        <div className="mt-8 rounded-[24px] border border-white/6 bg-black/10 px-5 py-5">
          <p className="section-kicker mb-2">Current phase</p>
          <p className="text-sm text-[var(--ink-2)]">
            OAuth and local token storage are live. The archive can already read
            any activities present in the local database.
          </p>
          {latestActivity ? (
            <p className="mt-3 text-sm text-[var(--ink-3)]">
              Latest archived activity:{" "}
              <span className="text-[var(--ink-1)]">{latestActivity.name ?? "Untitled effort"}</span>
              {latestActivity.startDate
                ? ` · ${new Date(latestActivity.startDate).toLocaleDateString()}`
                : ""}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({
  connected,
  expired,
}: {
  connected: boolean;
  expired: boolean;
}) {
  if (!connected) {
    return (
      <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-xs font-medium text-[var(--ink-2)]">
        Disconnected
      </span>
    );
  }

  if (expired) {
    return (
      <span className="rounded-full border border-[var(--danger-soft)] bg-[rgba(229,102,74,0.12)] px-2 py-0.5 text-xs font-medium text-[var(--danger-ink)]">
        Token expired
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[rgba(168,226,108,0.22)] bg-[rgba(123,194,65,0.12)] px-2 py-0.5 text-xs font-medium text-[var(--accent-bright)]">
      Connected
    </span>
  );
}
