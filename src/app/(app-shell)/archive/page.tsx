import type { Metadata } from "next";
import Link from "next/link";

import {
  ArchiveStatusCard,
  PageMasthead,
  SectionHeader,
} from "@/components/visual-reboot";
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
    <main className="page-shell fs-view flex flex-col gap-8 pb-6 text-[var(--ink-1)]">
      <PageMasthead
        eyebrow="Archive"
        title="Local Data"
        sub="Read-only provenance for the local SQLite archive. Sync, import, and recompute stay on their source routes."
      />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Where things live" meta="read-only" />
        <div className="grid gap-3 md:grid-cols-3">
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
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Provenance" meta="local SQLite" />
        <ArchiveStatusCard snapshot={snapshot} />
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
      className="rounded-[20px] border border-white/6 bg-black/10 px-4 py-3 transition hover:border-white/12 hover:bg-white/[0.035]"
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">{body}</p>
    </Link>
  );
}
