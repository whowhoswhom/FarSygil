import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  kicker,
  actions,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${className}`.trim()}
    >
      <div className="flex max-w-2xl flex-col gap-2">
        {kicker ? <span className="section-kicker">{kicker}</span> : null}
        <h2 className="text-2xl font-semibold tracking-[-0.045em] text-[var(--ink-1)] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-[var(--ink-2)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
