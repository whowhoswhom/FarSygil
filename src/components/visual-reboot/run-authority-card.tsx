import { SourceLabel } from "@/components/dashboard";
import { AppIcon } from "@/components/app-shell/app-icons";

export function RunAuthorityCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <article className="dashboard-shell-card p-5 md:p-6">
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-[var(--source-strava-wash)] text-[var(--source-strava)]">
            <AppIcon name="source" className="text-[1.4rem]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--ink-3)]">
              Data source
            </p>
            <h3 className="mt-2 text-[1.85rem] font-semibold tracking-[-0.04em] text-white">
              {title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
              {body}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <SourceLabel source="Strava" tone="exercise" />
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)]">
            <AppIcon name="source" className="text-lg" />
          </span>
        </div>
      </div>
    </article>
  );
}
