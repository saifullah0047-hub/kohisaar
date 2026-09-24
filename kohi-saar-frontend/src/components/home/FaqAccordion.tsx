import type { FaqItem } from "@/data/homeContent";

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  if (items.length === 0) {
    return (
      <div className="home-empty-state home-empty-state--dark" role="status">
        <p>Questions and answers will be added from approved product and support information.</p>
      </div>
    );
  }

  return (
    <div className="faq-accordion">
      {items.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
