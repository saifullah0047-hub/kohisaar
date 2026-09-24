interface SectionPlaceholderProps {
  id: string;
  eyebrow: string;
  title: string;
  note: string;
  tone?: "dark" | "cream";
}

export function SectionPlaceholder({ id, eyebrow, title, note, tone = "dark" }: SectionPlaceholderProps) {
  return (
    <section id={id} className={`placeholder-section placeholder-section--${tone}`}>
      <div className="page-shell placeholder-section__inner">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{note}</p>
        <span className="placeholder-label">Content to be supplied</span>
      </div>
    </section>
  );
}
