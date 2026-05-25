import { sql } from "drizzle-orm";
import Link from "next/link";
import type { AnySQLiteTable } from "drizzle-orm/sqlite-core";

import { MetricIconBadge } from "@/components/visual-reboot";
import { db } from "@/db/client";
import {
  activities,
  activityRawJson,
  activitySplits,
  activityStreams,
  dataImportLogs,
  healthMetrics,
  healthRawImports,
  trainingLoad,
  userSettings,
} from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [
    activityCount,
    rawPayloadCount,
    splitCount,
    streamCount,
    healthCount,
    healthImportCount,
    loadCount,
    syncLogCount,
    settingsCount,
  ] = await Promise.all([
    countRows(activities),
    countRows(activityRawJson),
    countRows(activitySplits),
    countRows(activityStreams),
    countRows(healthMetrics),
    countRows(healthRawImports),
    countRows(trainingLoad),
    countRows(dataImportLogs),
    countRows(userSettings),
  ]);

  return (
    <main className="page-shell flex flex-col gap-4 pb-6 text-[var(--ink-1)]">
      <section className="flex flex-col gap-2 px-1 pt-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-kicker mb-2">Settings</p>
          <h1 className="text-[2.3rem] font-semibold tracking-[-0.07em] text-white md:text-[2.95rem]">
            Settings
          </h1>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--ink-3)] md:text-right">
          Local runtime inventory, privacy boundaries, and future product
          controls.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="dashboard-shell-card p-4 md:p-5">
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <MetricIconBadge tone="recovery" icon="settings" />
                <div className="min-w-0">
                  <p className="section-kicker mb-1">Runtime</p>
                  <h2 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white md:text-[2.15rem]">
                    Local-first system
                  </h2>
                </div>
              </div>
              <span className="rounded-full border border-[rgba(168,226,108,0.22)] bg-[rgba(123,194,65,0.12)] px-3 py-1 text-xs font-medium text-[var(--accent-bright)]">
                Local SQLite
              </span>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
              FarSygil is single-user and explicit about what data exists
              locally versus what still requires a provider import or analytics
              module.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <SettingsHeroMetric label="Activities" value={String(activityCount)} />
              <SettingsHeroMetric label="Health rows" value={String(healthCount)} />
              <SettingsHeroMetric label="Load rows" value={String(loadCount)} />
            </div>

            <div className="mt-auto grid gap-2 sm:grid-cols-3">
              <Link
                href="/connect"
                className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold"
              >
                Connect
              </Link>
              <Link
                href="/health"
                className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold"
              >
                Health
              </Link>
              <Link
                href="/training-load"
                className="ghost-button inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold"
              >
                Load
              </Link>
            </div>
          </div>
        </article>

        <article className="dashboard-shell-card p-4 md:p-5">
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-kicker mb-1">Boundaries</p>
                <h2 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white md:text-[2.15rem]">
                  Network rules
                </h2>
              </div>
              <MetricIconBadge tone="trend" icon="connect" size="sm" />
            </div>

            <div className="grid gap-2">
              <BoundaryRow
                label="Strava"
                value="Outbound only when you connect or sync."
                state="explicit"
              />
              <BoundaryRow
                label="Apple Health"
                value="Imported from local XML or ZIP files."
                state="local"
              />
              <BoundaryRow
                label="Maps"
                value="Faux-map only. No tiles or geocoding."
                state="local"
              />
              <BoundaryRow
                label="Telemetry"
                value="No analytics or hosted event stream."
                state="off"
              />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-shell-card p-4 md:p-5">
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-kicker mb-1">Local database</p>
              <h2 className="text-[1.7rem] font-semibold tracking-[-0.05em] text-white md:text-[2.15rem]">
                Data inventory
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--ink-3)] md:text-right">
              Real row counts from the current SQLite database. Missing systems
              stay at zero or `--`; no sample data is injected.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
            <SettingsMetric label="Raw payloads" value={String(rawPayloadCount)} />
            <SettingsMetric label="Splits" value={String(splitCount)} />
            <SettingsMetric label="Streams" value={String(streamCount)} />
            <SettingsMetric label="Health imports" value={String(healthImportCount)} />
            <SettingsMetric label="Sync logs" value={String(syncLogCount)} />
            <SettingsMetric label="Prefs" value={String(settingsCount)} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="dashboard-shell-card p-4 md:p-5">
          <div className="relative flex flex-col gap-4">
            <div>
              <p className="section-kicker mb-1">Data model</p>
              <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white md:text-[1.9rem]">
                Stored locally
              </h2>
            </div>
            <div className="grid gap-2">
              <InfoRow
                label="Runs"
                body="Summary activities, detail payloads, splits, streams, and route polylines stay in SQLite."
              />
              <InfoRow
                label="Health"
                body="Apple Health metrics come from local exports only; no Apple cloud calls are made."
              />
              <InfoRow
                label="Load"
                body="Daily stress can be computed from local Strava fields; ATL, CTL, TSB, and recovery remain deferred."
              />
            </div>
          </div>
        </section>

        <section className="dashboard-shell-card p-4 md:p-5">
          <div className="relative flex flex-col gap-4">
            <div>
              <p className="section-kicker mb-1">Future controls</p>
              <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-white md:text-[1.9rem]">
                Preferences
              </h2>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <FuturePreference
                label="Week start"
                value="Data not available"
                hint="Calendar preferences have not been implemented yet."
              />
              <FuturePreference
                label="Training zones"
                value="Data not available"
                hint="Threshold and zone settings arrive with the analytics pass."
              />
              <FuturePreference
                label="AI chat"
                value="Data not available"
                hint="Grounded AI remains a later opt-in program."
              />
            </div>

            <p className="text-xs leading-relaxed text-[var(--ink-3)]">
              This route exposes only real system state today. Controls that do
              not exist yet render as honest empty bodies, not inactive fake
              toggles.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function SettingsHeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="section-kicker mb-2">{label}</p>
      <p className="dashboard-tile-value text-[1.8rem] font-semibold text-white md:text-[2.25rem]">
        {value}
      </p>
    </div>
  );
}

function SettingsMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="mb-2 truncate text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[var(--ink-3)]">
        {label}
      </p>
      <p className="dashboard-tile-value text-[1.55rem] font-semibold text-white md:text-[1.85rem]">
        {value}
      </p>
    </div>
  );
}

function BoundaryRow({
  label,
  value,
  state,
}: {
  label: string;
  value: string;
  state: "explicit" | "local" | "off";
}) {
  const stateLabel =
    state === "explicit" ? "Explicit" : state === "local" ? "Local" : "Off";
  const stateClass =
    state === "explicit"
      ? "border-[rgba(255,122,51,0.18)] bg-[rgba(255,122,51,0.1)] text-[var(--metric-source-strava)]"
      : state === "local"
        ? "border-[rgba(168,226,108,0.18)] bg-[rgba(123,194,65,0.1)] text-[var(--accent-bright)]"
        : "border-white/8 bg-white/[0.03] text-[var(--ink-3)]";

  return (
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">{label}</p>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${stateClass}`}>
          {stateLabel}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--ink-3)]">{value}</p>
    </div>
  );
}

function InfoRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/10 px-3 py-3">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">{body}</p>
    </div>
  );
}

function FuturePreference({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="dashboard-mock-empty rounded-[18px] p-4">
      <p className="section-kicker mb-2">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--ink-3)]">{hint}</p>
    </div>
  );
}

function countRows(table: AnySQLiteTable) {
  return db
    .select({ count: sql<number>`count(*)` })
    .from(table)
    .then((rows) => rows[0]?.count ?? 0);
}
