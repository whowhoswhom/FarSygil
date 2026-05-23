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
    <main className="page-shell flex flex-col gap-4 pb-6 text-[var(--ink-1)]">
      <section className="flex flex-col gap-2 px-1 pt-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="section-kicker mb-2">Archive</p>
          <h1 className="text-[2.3rem] font-semibold tracking-[-0.07em] text-white md:text-[2.95rem]">
            Local Data
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-3)] md:text-right">
          Read-only provenance for local SQLite. Mutations stay on source
          routes.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ArchiveRouteNote
          title="Strava sync"
          body="Summary and detail sync controls stay on Connect."
          href="/connect"
        />
        <ArchiveRouteNote
          title="Health import"
          body="Apple Health XML and ZIP import controls stay on Health."
          href="/health"
        />
        <ArchiveRouteNote
          title="Load input"
          body="Daily stress recompute stays on Training Load."
          href="/training-load"
        />
      </section>

      <ArchiveStatusCard snapshot={snapshot} />
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
      className="rounded-[20px] border border-white/6 bg-black/10 px-4 py-3 transition hover:border-white/12 hover:bg-white/[0.035]"
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">{body}</p>
    </Link>
  );
}
