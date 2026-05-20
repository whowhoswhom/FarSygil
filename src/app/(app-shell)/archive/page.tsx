import type { Metadata } from "next";
import Link from "next/link";

import { ArchiveStatusCard } from "@/components/visual-reboot";
import { databasePath, db } from "@/db/client";
import { getArchiveStatusSnapshot } from "@/server/archive/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive | FarSygil",
  description:
    "Read-only local SQLite provenance for the FarSygil training archive.",
};

export default async function ArchivePage() {
  const snapshot = await getArchiveStatusSnapshot(db, { databasePath });

  return (
    <main className="page-shell flex flex-col gap-6 pb-6 text-[var(--ink-1)]">
      <section className="px-1 pt-1">
        <p className="section-kicker mb-3">Archive</p>
        <h1 className="text-[2.9rem] font-semibold tracking-[-0.07em] text-white md:text-[4rem]">
          Local Data
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[var(--ink-2)]">
          Read-only provenance for the local SQLite archive. Sync, import, and
          recompute actions stay on their source-specific routes.
        </p>
      </section>

      <ArchiveStatusCard snapshot={snapshot} />

      <section className="dashboard-shell-card p-5 md:p-6">
        <div className="relative grid gap-4 md:grid-cols-3">
          <ArchiveRouteNote
            title="Strava"
            body="OAuth, summary sync, and detail sync are managed from Connect."
            href="/connect"
          />
          <ArchiveRouteNote
            title="Apple Health"
            body="ZIP and XML imports are managed from Health."
            href="/health"
          />
          <ArchiveRouteNote
            title="Training Load"
            body="Daily stress recompute is managed from Training Load."
            href="/training-load"
          />
        </div>
      </section>
    </main>
  );
}

function ArchiveRouteNote({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[20px] border border-white/6 bg-black/10 px-4 py-4 text-left hover:border-white/12 hover:bg-white/[0.03]"
    >
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-3)]">{body}</p>
    </Link>
  );
}
