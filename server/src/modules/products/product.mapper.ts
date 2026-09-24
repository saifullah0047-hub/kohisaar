import type { Prisma } from "@prisma/client";

export const publicProductSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  description: true,
  availability: true,
  featured: true,
  category: { select: { id: true, name: true, slug: true } },
  variants: { select: { id: true, name: true, price: true, compareAtPrice: true, currency: true }, orderBy: { createdAt: "asc" } },
  images: { select: { id: true, src: true, alt: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductSelect;

export type PublicProduct = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;

export function toPublicProduct(product: PublicProduct) {
  const firstVariant = product.variants[0];
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: firstVariant ? Number(firstVariant.price) : null,
    compareAtPrice: firstVariant?.compareAtPrice == null ? null : Number(firstVariant.compareAtPrice),
    currency: firstVariant?.currency ?? null,
    availability: product.availability,
    featured: product.featured,
    category: product.category,
    variants: product.variants.map((variant) => ({ id: variant.id, name: variant.name, price: Number(variant.price), compareAtPrice: variant.compareAtPrice == null ? null : Number(variant.compareAtPrice), currency: variant.currency })),
    images: product.images,
  };
}
