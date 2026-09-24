"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductDetail } from "@/components/products/ProductDetail";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import type { Product } from "@/types/product";
import { mapApiProduct, type ApiProduct } from "@/lib/product-api";
import { track } from "@/lib/analytics";

interface ProductRouteProps { slug: string; }
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export function ProductRoute({ slug, initialProduct }: ProductRouteProps & { initialProduct?: Product | null }) {
  const hasServerResult = initialProduct !== undefined;
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!hasServerResult);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (hasServerResult) {
      if (initialProduct) track("view_item", { items: [{ itemId: initialProduct.id, itemName: initialProduct.name, price: initialProduct.price, currency: initialProduct.currency }] });
      return;
    }

    const controller = new AbortController();
    fetch(`${apiBaseUrl}/products/slug/${encodeURIComponent(slug)}`, { signal: controller.signal }).then(async (response) => { if (!response.ok) throw new Error("Product request failed"); return response.json() as Promise<{ data: ApiProduct }>; }).then((response) => { const mapped = mapApiProduct(response.data); if (!mapped) throw new Error("Product pricing unavailable"); setFetchedProduct(mapped); track("view_item", { items: [{ itemId: mapped.id, itemName: mapped.name, price: mapped.price, currency: mapped.currency }] }); }).catch((requestError: unknown) => { if (requestError instanceof DOMException && requestError.name === "AbortError") return; setError(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [hasServerResult, initialProduct, slug]);
  const product = hasServerResult ? initialProduct ?? null : fetchedProduct;
  const resolvedLoading = hasServerResult ? false : loading;
  const resolvedError = hasServerResult ? !initialProduct : error;
  const productSchema = product ? { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.shortDescription, sku: product.id, image: product.images.map((image) => image.src), offers: { "@type": "Offer", url: `https://kohisaar.com/products/${product.slug}`, priceCurrency: product.currency, price: product.price, availability: product.availability === "available" ? "https://schema.org/InStock" : product.availability === "preorder" ? "https://schema.org/PreOrder" : "https://schema.org/OutOfStock", seller: { "@type": "Organization", name: "Kohisaar" } } } : null;
  return <><Navbar />{resolvedLoading ? <main className="route-placeholder" aria-live="polite"><p className="eyebrow">Kohisaar</p><h1>Loading product.</h1></main> : resolvedError || !product ? <main className="route-placeholder" aria-live="polite"><p className="eyebrow">Kohisaar</p><h1>Product unavailable.</h1></main> : <><nav className="breadcrumbs page-shell" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/shop">Shop</Link><span aria-hidden="true">/</span><span aria-current="page">{product.name}</span></nav><ProductDetail product={product} relatedProducts={[]} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} /></>}<Footer /></>;
}
