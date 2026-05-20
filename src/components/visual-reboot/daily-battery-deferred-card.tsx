import Link from "next/link";

import { AppIcon } from "@/components/app-shell/app-icons";

export interface DailyBatteryInput {
  label: string;
  source: string;
  available: boolean;
  detail: string;
}

export function DailyBatteryDeferredCard({
  inputs,
  href = "/training-load",
}: {
  inputs: DailyBatteryInput[];
  href?: string;
}) {
  return (
    <article className="dashboard-shell-card p-5 md:p-6">
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.035] text-[var(--ink-2)]"
            >
              <AppIcon name="source" className="text-[1.15rem]" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[2rem] font-semibold tracking-[-0.045em] text-white">
                Daily Battery (deferred)
              </h3>
              <p className="mt-1 text-sm text-[var(--ink-2)]">
                Derived input provenance
              </p>
            </div>
          </div>
          <Link
            href={href}
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)] hover:text-white"
            aria-label="Open Training Load"
          >
            <AppIcon name="arrow-right" className="text-xl" />
          </Link>
        </div>

        <div className="grid gap-3">
          {inputs.map((input) => (
            <div
              key={input.label}
              className="flex items-start justify-between gap-4 rounded-[18px] border border-white/6 bg-black/10 px-4 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{input.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-3)]">
                  {input.detail}
                </p>
              </div>
              <span
                className={`inline-flex flex-none rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  input.available
                    ? "border-[rgba(168,226,108,0.2)] bg-[rgba(123,194,65,0.1)] text-[var(--accent-bright)]"
                    : "border-white/10 bg-white/[0.035] text-[var(--ink-3)]"
                }`.trim()}
              >
                {input.available ? "Present" : "Absent"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-[var(--ink-3)]">
          No battery score is computed in this redesign. This card only shows
          whether the required real inputs exist locally.
        </p>
      </div>
    </article>
  );
}
