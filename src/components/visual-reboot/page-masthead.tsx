import type { ReactNode } from "react";

/**
 * Shared editorial masthead used at the top of every shell route: a small
 * uppercase eyebrow, a large tightly-tracked title, an optional lede line, and
 * an optional right-aligned status/actions slot. One header language across the
 * whole app.
 */
export function PageMasthead({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-[var(--fs-line)] pb-5">
      <div className="min-w-0">
        {eyebrow ? <p className="fs-eyebrow">{eyebrow}</p> : null}
        <h1
          className="mt-2 text-[2.4rem] leading-[0.98] tracking-[-0.055em] text-balance text-white md:text-[3.3rem]"
          style={{ fontWeight: 640 }}
        >
          {title}
        </h1>
        {sub ? (
          <p className="mt-2 max-w-[46ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            {sub}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-col items-start gap-3 sm:items-end">{actions}</div>
      ) : null}
    </header>
  );
}
