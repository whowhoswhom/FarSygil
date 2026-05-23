export function RunStatStrip({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
    unit?: string;
    toneVar?: string;
  }>;
}) {
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-[24px] border border-white/10 bg-black/10">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-col gap-1.5 border-r border-white/10 px-1.5 py-3 last:border-r-0 min-[430px]:px-2.5 md:px-4 md:py-4"
        >
          <p className="truncate text-[0.68rem] font-medium text-[var(--ink-2)] md:text-sm">
            {item.label}
          </p>
          <div className="flex min-w-0 flex-col items-start gap-0 md:flex-row md:items-end md:gap-2">
            <span
              className="dashboard-tile-value min-w-0 truncate text-[1.22rem] font-semibold leading-none tracking-[-0.08em] min-[430px]:text-[1.45rem] sm:text-[1.9rem] md:text-[2.2rem]"
              style={{ color: item.toneVar ?? "white" }}
            >
              {item.value}
            </span>
            {item.unit ? (
              <span className="text-[0.58rem] font-medium leading-none text-[var(--ink-2)] min-[430px]:text-[0.68rem] md:pb-1 md:text-[0.9rem]">
                {item.unit}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
