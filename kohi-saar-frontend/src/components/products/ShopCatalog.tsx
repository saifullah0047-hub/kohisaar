"use client";

import { useEffect, useState } from "react";
import { ShopToolbar } from "@/components/products/ShopHeader";
import { ProductGrid } from "@/components/products/ProductGrid";
import type { Product } from "@/types/product";

interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number | null;
  compareAtPrice: number | null;
  currency: string | null;
  availability: Product["availability"];
  featured: boolean;
  category: { id: string; name: string; slug: string };
  variants: Array<{ id: string; name: string; price: number; compareAtPrice: number | null; currency: string }>;
  images: Product["images"];
}

interface ApiResponse { data: ApiProduct[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }
interface Category { id: string; name: string; slug: string; }
type SortOption = "newest" | "name" | "price-asc" | "price-desc";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

function toProduct(product: ApiProduct): Product | null {
  if (product.price === null || product.currency === null) return null;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    currency: product.currency,
    availability: product.availability.toLowerCase() as Product["availability"],
    featured: product.featured,
    category: product.category.name,
    variants: product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, compareAtPrice: v.compareAtPrice ?? undefined, currency: v.currency })),
    images: product.images,
  };
}

export function ShopCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page), limit: "12", sort });
    if (debouncedSearch.trim()) query.set("search", debouncedSearch.trim());
    if (category) query.set("category", category);
    fetch(`${apiBaseUrl}/products?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Product request failed"); return response.json() as Promise<ApiResponse>; })
      .then((response) => {
        setProducts(response.data.map(toProduct).filter((p): p is Product => p !== null));
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
        setError(undefined);
      })
      .catch((err: unknown) => { if (err instanceof DOMException && err.name === "AbortError") return; setError("The collection could not be loaded. Please try again later."); setProducts([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, page, debouncedSearch, sort]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/categories`, { signal: controller.signal })
      .then(async (r) => { if (!r.ok) throw new Error("fail"); return r.json() as Promise<{ data: Category[] }>; })
      .then((r) => setCategories(r.data))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); setLoading(true); };
  const handleCategoryChange = (slug: string) => { setCategory(slug); setPage(1); setLoading(true); };
  const handleSortChange = (newSort: SortOption) => { setSort(newSort); setPage(1); setLoading(true); };

  return (
    <div className="shop-catalog">
      <div className="shop-collection-intro">
        <div>
          <p className="eyebrow">THE KOHISAAR EDIT</p>
          <h2>Objects of origin, made for the ritual.</h2>
        </div>
        <p>
          Explore considered forms of Himalayan resin, selected for different rhythms,
          moments, and ways of beginning.
        </p>
      </div>
      <ShopToolbar
        search={search}
        onSearchChange={handleSearchChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        sort={sort}
        onSortChange={handleSortChange}
        categories={categories}
        total={total}
        loading={loading}
      />

      {loading ? (
        <div className="shop-loading" role="status">Loading collection</div>
      ) : error ? (
        <div className="shop-error" role="alert">{error}</div>
      ) : (
        <div className="shop-collection">
          <ProductGrid products={products} />
        </div>
      )}

      {!loading && !error && totalPages > 1 ? (
        <div className="shop-pagination">
          <button type="button" disabled={page === 1} onClick={() => { setPage((v) => v - 1); setLoading(true); }}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => { setPage((v) => v + 1); setLoading(true); }}>Next</button>
        </div>
      ) : null}
    </div>
  );
}
