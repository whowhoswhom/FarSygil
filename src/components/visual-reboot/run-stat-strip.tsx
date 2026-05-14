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
    <div className="grid gap-3 rounded-[26px] border border-white/8 bg-black/10 p-4 md:grid-cols-5 md:p-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-col gap-2 rounded-[20px] border border-white/6 bg-black/10 px-4 py-4"
        >
          <p className="text-sm font-medium text-[var(--ink-2)]">{item.label}</p>
          <div className="flex items-end gap-2">
            <span
              className="dashboard-tile-value text-[2.6rem] font-semibold"
              style={{ color: item.toneVar ?? "white" }}
            >
              {item.value}
            </span>
            {item.unit ? (
              <span className="pb-1 text-[1rem] font-medium text-[var(--ink-2)]">
                {item.unit}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
