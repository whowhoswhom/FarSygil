/**
 * Editorial section header: a title, a hairline rule that fills the row, and an
 * optional right-aligned meta note. Used to group domains (Running, Physiology,
 * Derived, …) with quiet structure and plenty of air.
 */
export function SectionHeader({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <div className="fs-section-head">
      <span className="fs-section-title">{title}</span>
      <span className="fs-rule" style={{ flex: 1, alignSelf: "center" }} />
      {meta ? <span className="fs-section-meta">{meta}</span> : null}
    </div>
  );
}
