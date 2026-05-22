import type { Metadata } from "next";

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
    </main>
  );
}
