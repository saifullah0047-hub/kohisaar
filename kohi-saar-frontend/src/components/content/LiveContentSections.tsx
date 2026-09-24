import Link from "next/link";
import Image from "next/image";
import type { FaqItem, JournalArticle, Review } from "@/data/homeContent";
import { FaqAccordion } from "@/components/home/FaqAccordion";
import { journalArticle } from "@/data/journalArticle";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

async function getContent<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return (await response.json() as { data: T }).data;
  } catch {
    return null;
  }
}

export async function LiveReviewsSection() {
  const reviews = await getContent<Review[]>("/reviews");
  if (!reviews?.length) return null;
  return <section id="reviews" className="home-section reviews-section"><div className="page-shell"><p className="eyebrow">Customer voice</p><h2>What people say.</h2><div className="review-grid">{reviews.map((review) => <figure key={review.id}><blockquote>{review.quote}</blockquote><figcaption>{review.author}</figcaption></figure>)}</div></div></section>;
}

export async function LiveHomepageSection({ sectionKey, className }: { sectionKey: string; className: string }) {
  const sections = await getContent<Array<{ key: string; eyebrow?: string; title?: string; body?: string; imageSrc?: string; imageAlt?: string; ctaLabel?: string; ctaHref?: string }>>("/content/homepage");
  const section = sections?.find((item) => item.key === sectionKey);
  return <section className={`home-section ${className}`}><div className="page-shell editorial-content"><p className="eyebrow">{section?.eyebrow ?? "Content pending"}</p><h2>{section?.title ?? "This section is being prepared."}</h2>{section?.body ? <p>{section.body}</p> : <p>Approved content will appear here when available.</p>}{section?.ctaHref && section.ctaLabel ? <Link className="text-link" href={section.ctaHref}>{section.ctaLabel}</Link> : null}</div></section>;
}

export async function LiveJournalSection() {
  const remoteArticles = await getContent<Array<JournalArticle & { slug: string }>>("/content/articles");
  const articles: JournalArticle[] = remoteArticles?.length
    ? remoteArticles.map((article) => ({ ...article, href: article.slug }))
    : [{ id: "local-journal-article", title: journalArticle.title, excerpt: journalArticle.excerpt, href: journalArticle.slug }];
  const article = articles[0];
  const articleImage = "/images/jour.jpeg";
  return (
    <section id="journal" className="home-section journal-section">
      {article ? (
        <article className="journal-feature">
          <Link className="journal-feature__image-link" href={`/journal/${article.href}`} aria-label={`Read ${article.title}`}>
            <Image className="journal-feature__image" src={articleImage} alt="Kohisaar Himalayan Shilajit" fill sizes="100vw" />
          </Link>
          <div className="journal-feature__content">
            <p className="eyebrow">FIELD NOTES</p>
            <h2>Journal.</h2>
            <Link className="journal-feature__title" href={`/journal/${article.href}`}>
              <h3>{article.title}</h3>
            </Link>
            <p>{article.excerpt}</p>
            <Link className="journal-feature__link" href={`/journal/${article.href}`}>
              READ THE ARTICLE <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      ) : null}
      {articles.length > 1 ? (
        <div className="page-shell" style={{ paddingTop: "48px", paddingBottom: "32px" }}>
          <div className="journal-grid">
            {articles.slice(1).map((item) => (
              <Link key={item.id} href={`/journal/${item.href}`} className="journal-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", marginBottom: "16px", overflow: "hidden" }}>
                  <Image src="/images/jour.jpeg" alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                </div>
                <h3 style={{ color: "var(--cream)", fontSize: "1.15rem" }}>{item.title}</h3>
                {item.excerpt && <p style={{ color: "rgba(247, 244, 238, 0.75)", fontSize: "0.9rem" }}>{item.excerpt}</p>}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export async function LiveFaqSection() {
  const faqs = await getContent<FaqItem[]>("/content/faqs");
  if (!faqs?.length) return null;
  return <section id="faq" className="home-section faq-section"><div className="page-shell faq-section__inner"><div><p className="eyebrow">Clarity</p><h2>Frequently asked questions.</h2></div><FaqAccordion items={faqs} /></div></section>;
}
