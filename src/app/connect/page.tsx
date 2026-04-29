import Link from "next/link";

import { getStravaConnectionStatus } from "@/server/strava/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Strava did not return an authorization code.",
  invalid_state: "OAuth state mismatch — please try connecting again.",
  token_exchange_failed:
    "Could not exchange the authorization code for tokens. Check your Strava credentials.",
  strava_access_denied: "You denied access on Strava.",
  unexpected_error: "An unexpected error occurred during the Strava OAuth flow.",
};

function describeReason(reason: string | undefined): string {
  if (!reason) return "Something went wrong connecting Strava.";
  if (reason in ERROR_MESSAGES) return ERROR_MESSAGES[reason];
  if (reason.startsWith("strava_")) {
    return `Strava reported: ${reason.slice("strava_".length).replace(/_/g, " ")}.`;
  }
  return "Something went wrong connecting Strava.";
}

function formatExpiry(expiresAt: number | null): string {
  if (!expiresAt) return "--";
  try {
    return new Date(expiresAt * 1000).toLocaleString();
  } catch {
    return "--";
  }
}

interface ConnectPageProps {
  searchParams: Promise<{ status?: string; reason?: string }>;
}

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
  const params = await searchParams;
  const status = await getStravaConnectionStatus();

  const showSuccess = params.status === "connected";
  const showError = params.status === "error";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            ← Back
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Connect Strava
          </h1>
          <p className="mt-2 text-zinc-400">
            Authorize FarSygil to read your activity data. Tokens are stored
            locally in <code className="text-zinc-300">data/running.db</code>.
          </p>
        </div>

        {showSuccess && (
          <div className="mb-6 rounded-lg border border-emerald-900 bg-emerald-950/40 px-4 py-3 text-emerald-200 text-sm">
            Strava connected successfully.
          </div>
        )}

        {showError && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-red-200 text-sm">
            {describeReason(params.reason)}
          </div>
        )}

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-6">
          <div className="flex items-center justify-between mb-4">
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
              className="inline-flex items-center justify-center rounded-md bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors"
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
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
        Disconnected
      </span>
    );
  }
  if (expired) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-900">
        Token expired
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-900">
      Connected
    </span>
  );
}
