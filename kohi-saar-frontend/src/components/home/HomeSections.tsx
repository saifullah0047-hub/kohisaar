import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import { products as fallbackProducts } from "@/data/products";
import type { Product } from "@/types/product";
import { LiveFaqSection, LiveJournalSection, LiveReviewsSection } from "@/components/content/LiveContentSections";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  price: number | null;
  compareAtPrice?: number | null;
  currency?: string | null;
  availability?: string;
  featured?: boolean;
  category?: { name: string } | string;
  variants?: Array<{ id: string; name: string; price: number; compareAtPrice: number | null; currency: string }>;
  images?: Array<{ src: string; alt: string }>;
}

function mapToProduct(item: ApiProduct): Product {
  const primaryVariant = item.variants?.[0];
  const price = item.price ?? primaryVariant?.price ?? 0;
  const currency = item.currency ?? primaryVariant?.currency ?? "PKR";
  const catName =
    typeof item.category === "object" && item.category !== null && "name" in item.category
      ? item.category.name
      : typeof item.category === "string"
        ? item.category
        : "Pure Shilajit";

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    shortDescription: item.shortDescription || item.name,
    description: item.description || item.shortDescription || item.name,
    price,
    compareAtPrice: item.compareAtPrice ?? primaryVariant?.compareAtPrice ?? undefined,
    currency,
    availability: (item.availability?.toLowerCase() as Product["availability"]) || "available",
    featured: Boolean(item.featured),
    category: catName,
    variants: (item.variants || []).map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price,
      compareAtPrice: v.compareAtPrice ?? undefined,
      currency: v.currency,
    })),
    images: item.images?.length
      ? item.images
      : [{ src: "/images/premium.jpeg", alt: item.name }],
  };
}

export function FeaturedProductsSection() {
  return <FeaturedProductsContent />;
}

async function FeaturedProductsContent() {
  let featuredProducts = fallbackProducts.filter((product) => product.featured);

  try {
    const response = await fetch(`${API_BASE_URL}/products/featured`, { next: { revalidate: 300 } });
    if (response.ok) {
      const result = await response.json() as { data: ApiProduct[] };
      if (result.data?.length) featuredProducts = result.data.map(mapToProduct);
    }
  } catch {
    // Keep the local collection available when the API is unavailable.
  }

  return (
    <section id="featured-products" className="home-section featured-products">
      <div className="page-shell">
        <div className="home-section__heading">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>Selected for the ritual.</h2>
            <p className="home-section__intro">
              A considered selection of pure Himalayan shilajit resin, prepared for the ritual.
            </p>
          </div>
          <Link className="text-link" href="/shop">
            View all products
          </Link>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product, index, collection) => (
            <ProductCard
              key={product.id}
              product={product}
              catalogPosition={index + 1}
              catalogTotal={collection.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandIntroductionSection() {
  return (
    <section className="home-section brand-introduction" aria-labelledby="brand-statement-heading">
      <div className="brand-introduction__media" aria-hidden="true">
        <Image
          src="/images/flot.jpeg"
          alt=""
          fill
          sizes="100vw"
          className="brand-introduction__image"
        />
      </div>
      <div className="brand-introduction__veil" aria-hidden="true" />
      <div className="page-shell brand-introduction__layout">
        <div className="brand-introduction__heading">
          <p className="eyebrow">THE KOHISAAR WAY</p>
          <h2 id="brand-statement-heading">Purity, presented with purpose.</h2>
        </div>
        <div className="brand-introduction__body">
          <p>Kohisaar is built around a simple idea: authentic Himalayan Shilajit should be presented with care, clarity, and respect for its origin.</p>
          <p>From sourcing to presentation, every detail is considered to keep the experience honest, refined, and rooted in the character of the mountains.</p>
          <Link className="brand-introduction__link" href="/story">DISCOVER OUR STORY <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>
  );
}

export function CampaignSection() {
  return (
    <section className="home-section campaign-section">
      <div className="campaign-section__media" aria-hidden="true">
        <Image src="/images/flot.jpeg" alt="" fill sizes="(max-width: 800px) 100vw, 58vw" />
      </div>
      <div className="campaign-section__veil" />
      <div className="page-shell campaign-section__content">
        <p className="eyebrow">FROM THE HIMALAYAS</p>
        <h2>A ritual shaped by the mountains.</h2>
        <p>Rooted in origin. Refined for today.</p>
        <Link className="text-link" href="/story">EXPLORE OUR STORY <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}

export function QualityRitualSection() {
  return (
    <section id="how-to-use" className="home-section quality-ritual-section">
      <div className="page-shell quality-ritual-section__inner">
        <section className="quality-band" aria-labelledby="quality-heading">
          <p className="eyebrow">QUALITY, WITH CLARITY</p>
          <h2 id="quality-heading">What matters is what&apos;s inside.</h2>
          <p className="quality-band__intro">
            We keep the focus simple: considered sourcing, the natural character of
            the resin, careful presentation, and clear information at every step.
          </p>
          <div className="quality-divider" aria-hidden="true" />
          <div className="quality-points">
            <article className="quality-cell">
              <span className="quality-cell__num" aria-hidden="true">01</span>
              <span className="quality-cell__underline" aria-hidden="true" />
              <h3 className="quality-cell__label">SOURCE</h3>
              <strong className="quality-cell__heading">Rooted in the Himalayas.</strong>
              {/* BODY COPY PLACEHOLDER: shortened — confirm with me */}
              <p className="quality-cell__body">
                We select Shilajit with attention to its origin and character, keeping
                its connection to the mountains at the centre of the experience.
              </p>
            </article>
            <article className="quality-cell">
              <span className="quality-cell__num" aria-hidden="true">02</span>
              <span className="quality-cell__underline" aria-hidden="true" />
              <h3 className="quality-cell__label">CHARACTER</h3>
              <strong className="quality-cell__heading">Natural character, left respected.</strong>
              {/* BODY COPY PLACEHOLDER: shortened — confirm with me */}
              <p className="quality-cell__body">
                Shilajit has its own distinctive colour, texture, aroma, and consistency.
                We present these characteristics without unnecessary embellishment.
              </p>
            </article>
            <article className="quality-cell">
              <span className="quality-cell__num" aria-hidden="true">03</span>
              <span className="quality-cell__underline" aria-hidden="true" />
              <h3 className="quality-cell__label">RITUAL</h3>
              <strong className="quality-cell__heading">Refined for the ritual.</strong>
              {/* BODY COPY PLACEHOLDER: shortened — confirm with me */}
              <p className="quality-cell__body">
                From preparation to delivery, presentation is kept considered, simple,
                and purposeful — designed to support a daily ritual.
              </p>
            </article>
            <article className="quality-cell">
              <span className="quality-cell__num" aria-hidden="true">04</span>
              <span className="quality-cell__underline" aria-hidden="true" />
              <h3 className="quality-cell__label">TRANSPARENCY</h3>
              <strong className="quality-cell__heading">Clear information, without the noise.</strong>
              {/* BODY COPY PLACEHOLDER: shortened — confirm with me */}
              <p className="quality-cell__body">
                Product details, pricing, usage guidance, and important information
                are kept straightforward — nothing hidden, nothing inflated.
              </p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}

export function ReviewsSection() {
  return <LiveReviewsSection />;
}

export function JournalSection() {
  return <LiveJournalSection />;
}

export function FaqSection() {
  return <LiveFaqSection />;
}

export function FinalCtaSection() {
  return (
    <section id="final-cta" className="home-section final-cta" aria-labelledby="final-cta-heading">
      <div className="page-shell final-cta__content">
        <p className="eyebrow">The next chapter</p>
        <h2 id="final-cta-heading">Begin with Kohisaar.</h2>
        <Link className="final-cta__primary" href="/shop">
          Explore the collection <span aria-hidden="true">→</span>
        </Link>
        <Link className="final-cta__secondary" href="/story">
          Or read our story <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
