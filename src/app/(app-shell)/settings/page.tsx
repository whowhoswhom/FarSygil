import { sql } from "drizzle-orm";

import { MetricIconBadge } from "@/components/visual-reboot";
import { db } from "@/db/client";
import { activities, healthMetrics, trainingLoad } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [activityCount, healthCount, loadCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .then((rows) => rows[0]?.count ?? 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(healthMetrics)
      .then((rows) => rows[0]?.count ?? 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(trainingLoad)
      .then((rows) => rows[0]?.count ?? 0),
  ]);

  return (
    <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
      <section className="px-1 pt-1">
        <p className="section-kicker mb-3">Settings</p>
        <h1 className="text-[2.9rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
          Settings
        </h1>
      </section>

      <section className="dashboard-shell-card p-6 md:p-7">
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <MetricIconBadge tone="recovery" icon="settings" size="lg" />
            <div>
              <h2 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-white">
                Local-first runtime
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--ink-2)]">
                FarSygil is single-user, SQLite-backed, and explicit about what
                data exists locally versus what still requires a provider sync
                or a later analytics module.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SettingsMetric label="Archived activities" value={String(activityCount)} />
            <SettingsMetric label="Health rows" value={String(healthCount)} />
            <SettingsMetric label="Load rows" value={String(loadCount)} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="dashboard-shell-card p-6">
          <div className="relative flex flex-col gap-4">
            <h2 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-white">
              Data model
            </h2>
            <p className="text-sm leading-relaxed text-[var(--ink-2)]">
              Summary activities, detail payloads, split rows, and stream rows
              stay local in SQLite. Health and training-load surfaces exist as
              real routes now, but they remain honestly empty until those data
              programs land.
            </p>
          </div>
        </section>

        <section className="dashboard-shell-card p-6">
          <div className="relative flex flex-col gap-4">
            <h2 className="text-[1.9rem] font-semibold tracking-[-0.04em] text-white">
              Future preferences
            </h2>
            <div className="dashboard-mock-empty rounded-[22px] p-5">
              <p className="text-base font-semibold text-white">Data not available</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-3)]">
                Preference toggles and customization controls have not been
                implemented yet. This route exists now so system-level controls
                no longer need to live on `/connect`.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
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
    <div className="rounded-[20px] border border-white/6 bg-black/10 px-4 py-4">
      <p className="section-kicker mb-2">{label}</p>
      <p className="dashboard-tile-value text-[2.4rem] font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
