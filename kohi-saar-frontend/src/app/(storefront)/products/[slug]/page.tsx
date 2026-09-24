import type { Metadata } from "next";
import { cache } from "react";
import { ProductRoute } from "@/components/products/ProductRoute";
import { mapApiProduct, type ProductResponse } from "@/lib/product-api";
import { API_BASE_URL, absoluteUrl, DEFAULT_DESCRIPTION } from "@/lib/seo";

const getProduct = cache(async (slug: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/slug/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return mapApiProduct((await response.json() as ProductResponse).data);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product unavailable", robots: { index: false, follow: true } };
  const description = product.shortDescription || product.description || DEFAULT_DESCRIPTION;
  return { title: product.name, description, alternates: { canonical: `/products/${product.slug}` }, openGraph: { type: "website", title: product.name, description, url: absoluteUrl(`/products/${product.slug}`), images: product.images.slice(0, 1).map((image) => ({ url: image.src, alt: image.alt || product.name })) }, twitter: { card: "summary_large_image", title: product.name, description, images: product.images.slice(0, 1).map((image) => image.src) } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <ProductRoute slug={resolvedParams.slug} initialProduct={await getProduct(resolvedParams.slug)} />;
}
