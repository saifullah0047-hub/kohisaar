import type { Product } from "@/types/product";

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number | null;
  compareAtPrice: number | null;
  currency: string | null;
  availability: string;
  featured: boolean;
  category: { name: string };
  variants: Array<{ id: string; name: string; price: number; compareAtPrice: number | null; currency: string }>;
  images: Product["images"];
  videoSrc?: string;
  ingredients?: string[];
  usage?: string;
  faq?: Product["faq"];
  shippingInformation?: string;
}

export interface ProductResponse {
  data: ApiProduct;
}

export function mapApiProduct(source: ApiProduct): Product | null {
  if (source.price === null || source.currency === null) return null;
  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    shortDescription: source.shortDescription,
    description: source.description,
    price: source.price,
    compareAtPrice: source.compareAtPrice ?? undefined,
    currency: source.currency,
    availability: source.availability.toLowerCase() as Product["availability"],
    featured: source.featured,
    category: source.category.name,
    variants: source.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice ?? undefined,
      currency: variant.currency,
    })),
    images: source.images,
    videoSrc: source.videoSrc,
    ingredients: source.ingredients,
    usage: source.usage,
    faq: source.faq,
    shippingInformation: source.shippingInformation,
  };
}
