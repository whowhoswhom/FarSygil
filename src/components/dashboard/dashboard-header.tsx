import type { CSSProperties, ReactNode } from "react";

interface DashboardHeaderProps {
  kicker?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DashboardHeader({
  kicker,
  title,
  description,
  meta,
  actions,
  className = "",
}: DashboardHeaderProps) {
  return (
    <header
      className={`surface-slab relative rounded-[30px] px-6 py-6 sm:px-8 sm:py-8 ${className}`.trim()}
    >
      <div
        className="dashboard-card-accent"
        style={
          {
            "--dashboard-tone": "var(--accent-bright)",
            "--dashboard-tone-wash": "rgba(168, 226, 108, 0.1)",
          } as CSSProperties
        }
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          {kicker ? <span className="section-kicker">{kicker}</span> : null}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[var(--ink-1)] sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--ink-2)] sm:text-lg">
              {description}
            </p>
          </div>
        </div>
        <div className="flex w-full max-w-xl flex-col items-start gap-4 lg:items-end">
          {meta ? (
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              {meta}
            </div>
          ) : null}
          {actions ? (
            <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
