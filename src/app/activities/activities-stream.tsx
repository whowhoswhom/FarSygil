"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterHud } from "@/app/activities/filter-hud";
import { ArchiveStrip } from "@/components/activities/archive-strip";
import { BandHeader } from "@/components/activities/band-header";
import { HeroTile } from "@/components/activities/hero-tile";
import { MajorTile } from "@/components/activities/major-tile";
import { MinorTile } from "@/components/activities/minor-tile";
import { computeArchiveTotals } from "@/lib/activities/aggregates";
import {
  applyActivityFilters,
  buildFilterSearchParams,
  getMaxDistanceMiles,
  getSportOptions,
  parseActivityFilters,
} from "@/lib/activities/filters";
import { formatArchiveCount, sportLabel } from "@/lib/activities/format";
import type { ArchiveActivity } from "@/lib/activities/types";

const INITIAL_ARCHIVE_COUNT = 12;

export function ActivitiesStream({
  activities,
}: {
  activities: ArchiveActivity[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [archiveCount, setArchiveCount] = useState(INITIAL_ARCHIVE_COUNT);
  const sportOptions = useMemo(() => getSportOptions(activities), [activities]);
  const filters = useMemo(
    () =>
      parseActivityFilters(
        new URLSearchParams(searchParams.toString()),
        sportOptions,
      ),
    [searchParams, sportOptions],
  );
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const deferredSearch = useDeferredValue(searchDraft);
  const maxDistanceMiles = useMemo(
    () => getMaxDistanceMiles(activities),
    [activities],
  );
  const replaceFilters = useCallback(
    (nextFilters: typeof filters) => {
      const nextSearchParams = buildFilterSearchParams(nextFilters);
      const nextUrl = nextSearchParams.size
        ? `${pathname}?${nextSearchParams.toString()}`
        : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, startTransition],
  );

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (deferredSearch === filters.search) {
      return;
    }

    const timeout = window.setTimeout(() => {
      replaceFilters({ ...filters, search: deferredSearch });
    }, 140);

    return () => window.clearTimeout(timeout);
  }, [deferredSearch, filters, replaceFilters]);

  const visibleActivities = useMemo(
    () => applyActivityFilters(activities, { ...filters, search: deferredSearch }),
    [activities, deferredSearch, filters],
  );

  useEffect(() => {
    setArchiveCount(INITIAL_ARCHIVE_COUNT);
  }, [
    deferredSearch,
    filters.minDistanceMiles,
    filters.range,
    filters.sort,
    filters.sport,
  ]);

  const heroActivity = visibleActivities[0] ?? null;
  const recentActivities = heroActivity ? visibleActivities.slice(1, 3) : [];
  const archiveActivities = heroActivity ? visibleActivities.slice(3) : [];
  const revealedActivities = archiveActivities.slice(0, archiveCount);
  const archiveTotals = useMemo(
    () =>
      computeArchiveTotals(
        visibleActivities.filter((activity) => activity.source === "strava"),
      ),
    [visibleActivities],
  );

  if (activities.length === 0) {
    return (
      <main className="page-shell min-h-screen px-4 pb-20 pt-24 text-[var(--ink-1)] md:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-white/8 bg-white/[0.03] px-8 py-14 text-center backdrop-blur-md">
          <p className="section-kicker mb-4">Archive</p>
          <h1 className="mb-4 text-5xl font-semibold tracking-[-0.06em] text-white">
            No activities have been archived yet.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-[var(--ink-2)]">
            Connect Strava and sync activities into the local database, then the
            Archive will render them as large navigable slabs instead of an empty
            dashboard shell.
          </p>
        </div>
      </main>
    );
  }

  function patchFilters(patch: Partial<typeof filters>) {
    replaceFilters({
      ...filters,
      ...patch,
      search: patch.search ?? searchDraft,
    });
  }

  return (
    <main className="page-shell min-h-screen px-4 pb-20 pt-6 text-[var(--ink-1)] md:px-8 lg:px-10">
      <HeroTile activity={heroActivity ?? activities[0]!} />

      <FilterHud
        filters={filters}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onPatchFilters={patchFilters}
        sportOptions={sportOptions}
        maxDistanceMiles={maxDistanceMiles}
        visibleCount={visibleActivities.length}
        totalCount={activities.length}
      />

      <div className="mx-auto mt-10 max-w-[1480px]">
        {recentActivities.length > 0 ? (
          <section className="mb-16">
            <BandHeader
              label="Recent"
              caption="After the hero, the archive relaxes into two substantial follow-up slabs."
            />
            <div className="grid grid-cols-12 gap-6">
              {recentActivities.map((activity) => (
                <MajorTile key={activity.id} activity={activity} />
              ))}
            </div>
          </section>
        ) : null}

        <ArchiveStrip totals={archiveTotals} />

        {revealedActivities.length > 0 ? (
          <section>
            <BandHeader
              label="Archive"
              caption={`${formatArchiveCount(archiveActivities.length)}${filters.sport !== "all" ? ` · ${sportLabel(filters.sport)}` : ""}${isPending ? " · Updating..." : ""}`}
            />
            <div className="grid grid-cols-12 gap-5 md:gap-6">
              {revealedActivities.map((activity) => (
                <MinorTile key={activity.id} activity={activity} />
              ))}
            </div>
            {archiveActivities.length > revealedActivities.length ? (
              <div className="flex justify-center pt-12">
                <button
                  type="button"
                  onClick={() =>
                    setArchiveCount((current) => current + INITIAL_ARCHIVE_COUNT)
                  }
                  className="ghost-button rounded-full px-6 py-3 text-sm font-semibold"
                >
                  Reveal {archiveActivities.length - revealedActivities.length}{" "}
                  earlier efforts
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="mx-auto max-w-2xl py-24 text-center">
            <p className="section-kicker mb-4">No matches</p>
            <h2 className="mb-3 text-4xl font-semibold tracking-[-0.05em] text-white">
              The archive is empty for this slice.
            </h2>
            <p className="text-base text-[var(--ink-2)]">
              Widen the range, lower the minimum distance, or clear the search to
              bring more of your local Strava history back into view.
            </p>
          </section>
        )}

        <footer className="mt-20 border-t border-white/6 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ink-3)]">
            <span>Stored locally · synced from Strava</span>
            <span>Archive v2</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
