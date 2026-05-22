import Link from "next/link";

import { AppIcon } from "@/components/app-shell/app-icons";

export interface DailyBatteryInput {
  label: string;
  source: string;
  available: boolean;
  detail: string;
  href?: string;
}

export function DailyBatteryDeferredCard({
  inputs,
  href = "/training-load",
}: {
  inputs: DailyBatteryInput[];
  href?: string;
}) {
  return (
    <article className="dashboard-shell-card p-4 md:p-5">
      <div className="relative flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.035] text-[var(--ink-2)]"
            >
              <AppIcon name="source" className="text-base" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-white">
                Daily Battery (deferred)
              </h3>
              <p className="mt-1 text-xs text-[var(--ink-2)]">
                Derived input provenance
              </p>
            </div>
          </div>
          <Link
            href={href}
            className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[var(--ink-2)] hover:text-white"
            aria-label="Open Training Load"
          >
            <AppIcon name="arrow-right" className="text-base" />
          </Link>
        </div>

        <div className="grid gap-2">
          {inputs.map((input) => (
            <div
              key={input.label}
              className="flex items-start justify-between gap-3 rounded-[14px] border border-white/6 bg-black/10 px-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-white">{input.label}</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
                    {input.source}
                  </span>
                </div>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-[var(--ink-3)]">
                  {input.detail}
                </p>
              </div>
              <InputStatusBadge input={input} />
            </div>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-[var(--ink-3)]">
          No battery score is computed in this redesign. This card only shows
          whether the required real inputs exist locally.
        </p>
      </div>
    </article>
  );
}

function InputStatusBadge({ input }: { input: DailyBatteryInput }) {
  const className = `inline-flex flex-none rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${
    input.available
      ? "border-[rgba(168,226,108,0.2)] bg-[rgba(123,194,65,0.1)] text-[var(--accent-bright)]"
      : "border-white/10 bg-white/[0.035] text-[var(--ink-3)]"
  }`.trim();
  const label = input.available ? "Present" : "Absent";

  if (!input.available && input.href) {
    return (
      <Link
        href={input.href}
        className={`${className} hover:border-white/20 hover:text-[var(--ink-1)]`}
        aria-label={`Open ${input.source} for ${input.label}`}
      >
        {label}
      </Link>
    );
  }

  return <span className={className}>{label}</span>;
}
