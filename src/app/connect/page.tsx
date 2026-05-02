import Link from "next/link";
import { db } from "@/db/client";
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

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            {"<- Back"}
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Connect Strava
          </h1>
          <p className="mt-2 text-zinc-400">
            Authorize FarSygil to read your activity data. Tokens are stored
            locally in <code className="text-zinc-300">data/running.db</code>.
          </p>
        </div>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Connection status
            </h2>
            <StatusBadge connected={status.connected} expired={status.expired} />
          </div>

          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-zinc-500">Athlete ID</dt>
            <dd className="text-zinc-200">
              {status.athleteId ?? <span className="text-zinc-500">--</span>}
            </dd>

            <dt className="text-zinc-500">Scope</dt>
            <dd className="text-zinc-200">
              {status.scope ?? <span className="text-zinc-500">--</span>}
            </dd>

            <dt className="text-zinc-500">Token expires</dt>
            <dd className="text-zinc-200">
              {status.connected ? formatExpiry(status.expiresAt) : "--"}
            </dd>

            <dt className="text-zinc-500">Last updated</dt>
            <dd className="text-zinc-200">
              {status.updatedAt ?? <span className="text-zinc-500">--</span>}
            </dd>
          </dl>

          <div className="mt-6">
            <a
              href="/api/strava/connect"
              className="inline-flex items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-500"
            >
              {status.connected ? "Reconnect Strava" : "Connect Strava"}
            </a>
          </div>
        </section>

        <p className="mt-8 text-xs text-zinc-600">
          Activity sync is not implemented yet. This page only handles OAuth
          and token storage.
        </p>
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
      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
        Disconnected
      </span>
    );
  }

  if (expired) {
    return (
      <span className="rounded-full border border-amber-900 bg-amber-950/60 px-2 py-0.5 text-xs font-medium text-amber-300">
        Token expired
      </span>
    );
  }

  return (
    <span className="rounded-full border border-emerald-900 bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-emerald-300">
      Connected
    </span>
  );
}
