import type { MetadataRoute } from "next";
import { API_BASE_URL, SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/shop", "/journal", "/story", "/contact", "/privacy", "/terms"].map((path) => ({ url: `${SITE_URL}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 }));
  try {
    const [productsResponse, articlesResponse] = await Promise.all([fetch(`${API_BASE_URL}/products`, { next: { revalidate: 3600 } }), fetch(`${API_BASE_URL}/content/articles`, { next: { revalidate: 3600 } })]);
    const products = productsResponse.ok ? (await productsResponse.json() as { data: Array<{ slug: string; updatedAt?: string }> }).data : [];
    const articles = articlesResponse.ok ? (await articlesResponse.json() as { data: Array<{ slug: string; updatedAt?: string }> }).data : [];
    return [...staticRoutes, ...products.map((item) => ({ url: `${SITE_URL}/products/${item.slug}`, lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(), changeFrequency: "daily" as const, priority: 0.8 })), ...articles.map((item) => ({ url: `${SITE_URL}/journal/${item.slug}`, lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(), changeFrequency: "weekly" as const, priority: 0.6 }))];
  } catch { return staticRoutes; }
}
