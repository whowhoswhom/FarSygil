export function BandHeader({
  label,
  caption,
}: {
  label: string;
  caption: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="section-kicker mb-2">{label}</p>
        <h2
          className="text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white md:text-[2.6rem]"
          style={{ fontFamily: "var(--font-geist-sans)" }}
        >
          {label}
        </h2>
      </div>
      <p className="text-sm text-[var(--ink-2)]">{caption}</p>
    </header>
  );
}
