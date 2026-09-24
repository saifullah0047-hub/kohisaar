"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Star, EyeOff, CheckCircle2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin-api";
import { sanitizeImageSrc } from "@/lib/image-utils";
import {
  AdminDataTable,
  type Column,
  StatusBadge,
  SearchInput,
  AdminModal,
  AdminFormField,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/admin/ui";

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  availableQuantity: number;
}

interface ProductImage {
  src: string;
  alt?: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  availability: "AVAILABLE" | "PREORDER" | "UNAVAILABLE";
  featured: boolean;
  category: { id?: string; name: string; slug?: string };
  variants: ProductVariant[];
  images?: ProductImage[];
}

interface CategoryOption {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    availability: "AVAILABLE" as "AVAILABLE" | "PREORDER" | "UNAVAILABLE",
    featured: false,
    price: 3900,
    compareAtPrice: "" as string | number,
    stockQuantity: 100,
    lowStockThreshold: 10,
    imageSrc: "/images/premium.jpeg",
    imageAlt: "",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminApi.get<{ data: Product[] }>("/admin/products"),
      adminApi.get<{ data: CategoryOption[] }>("/categories"),
    ])
      .then(([prodRes, catRes]) => {
        if (!cancelled) {
          setProducts(prodRes.data);
          setCategories(catRes.data);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load products or categories.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const load = () => setRetryToken((t) => t + 1);

  const handleNameChange = (val: string, isCreate: boolean) => {
    if (isCreate) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, name: val, slug }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleOpenCreate = () => {
    const defaultCatId = categories[0]?.id || "";
    setFormData({
      name: "",
      slug: "",
      categoryId: defaultCatId,
      shortDescription: "",
      description: "",
      availability: "AVAILABLE",
      featured: false,
      price: 3900,
      compareAtPrice: "",
      stockQuantity: 100,
      lowStockThreshold: 10,
      imageSrc: "/images/premium.jpeg",
      imageAlt: "",
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    const primaryVariant = p.variants[0];
    const primaryImage = p.images?.[0];
    const catId = p.category?.id || categories.find((c) => c.name === p.category?.name)?.id || "";

    setFormData({
      name: p.name,
      slug: p.slug,
      categoryId: catId,
      shortDescription: p.shortDescription || "",
      description: p.description || "",
      availability: p.availability,
      featured: p.featured,
      price: primaryVariant?.price ?? 0,
      compareAtPrice: primaryVariant?.compareAtPrice ?? "",
      stockQuantity: primaryVariant?.stockQuantity ?? 0,
      lowStockThreshold: primaryVariant?.lowStockThreshold ?? 10,
      imageSrc: primaryImage?.src || "/images/premium.jpeg",
      imageAlt: primaryImage?.alt || p.name,
    });
    setFormError(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim() || !formData.categoryId) {
      setFormError("Name, slug, and category are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const rawImage = formData.imageSrc.trim().replace(/^["']+|["']+$/g, "").trim();
    if (rawImage && (/^[a-zA-Z]:[/\\]/i.test(rawImage) || rawImage.startsWith("file:") || rawImage.includes("\\"))) {
      setFormError("Local computer paths (e.g. C:\\...) cannot be loaded by a web browser. Please place the image in public/images/ (e.g. /images/your-photo.jpg) or use a web URL (https://...).");
      setSubmitting(false);
      return;
    }
    const cleanImage = rawImage ? sanitizeImageSrc(rawImage) : undefined;

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      categoryId: formData.categoryId,
      shortDescription: formData.shortDescription.trim() || formData.name.trim(),
      description: formData.description.trim() || formData.shortDescription.trim() || formData.name.trim(),
      availability: formData.availability,
      featured: Boolean(formData.featured),
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice !== "" ? Number(formData.compareAtPrice) : undefined,
      currency: "PKR",
      stockQuantity: Number(formData.stockQuantity),
      lowStockThreshold: Number(formData.lowStockThreshold),
      imageSrc: cleanImage,
      imageAlt: formData.imageAlt.trim() || formData.name.trim(),
    };

    try {
      if (editingProduct) {
        await adminApi.patch(`/products/${editingProduct.id}`, payload);
        setEditingProduct(null);
      } else {
        await adminApi.post("/products", payload);
        setIsCreateOpen(false);
      }
      load();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setFormError(body?.message || `Error saving product (${err.statusText})`);
      } else {
        setFormError("Failed to save product. Please verify inputs.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await adminApi.patch(`/products/${product.id}`, {
        featured: !product.featured,
      });
      load();
    } catch {
      alert("Failed to toggle featured status.");
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    const nextAvailability = product.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    try {
      await adminApi.patch(`/products/${product.id}`, {
        availability: nextAvailability,
        ...(nextAvailability === "UNAVAILABLE" ? { featured: false } : {}),
      });
      load();
    } catch {
      alert("Failed to update product availability.");
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()));
    const matchesAvailability =
      availabilityFilter === "ALL" || p.availability === availabilityFilter;
    return matchesSearch && matchesAvailability;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Product",
      render: (row) => {
        const p = row as unknown as Product;
        const imgSrc = sanitizeImageSrc(p.images?.[0]?.src);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "4px",
                overflow: "hidden",
                background: "var(--adm-bg)",
                border: "1px solid var(--adm-border)",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <img
                src={imgSrc}
                alt={p.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/premium.jpeg";
                }}
              />
            </div>
            <div>
              <strong style={{ fontWeight: 500, color: "var(--adm-text-primary)" }}>{p.name}</strong>
              <br />
              <span style={{ color: "var(--adm-accent-dark)", fontSize: "11px", fontFamily: "monospace" }}>
                /{p.slug}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Category",
      render: (row) => {
        const p = row as unknown as Product;
        return (
          <span style={{ fontSize: "12px", color: "var(--adm-text-secondary)" }}>
            {p.category?.name || "Uncategorized"}
          </span>
        );
      },
    },
    {
      key: "availability",
      header: "Status",
      render: (row) => <StatusBadge status={String(row.availability)} />,
    },
    {
      key: "price",
      header: "Price",
      render: (row) => {
        const p = row as unknown as Product;
        const price = p.variants[0]?.price;
        return price !== undefined
          ? `${p.variants[0].currency || "PKR"} ${price.toLocaleString()}`
          : "—";
      },
    },
    {
      key: "stock",
      header: "Stock",
      render: (row) => {
        const p = row as unknown as Product;
        const total = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
        const reserved = p.variants.reduce((sum, v) => sum + v.reservedQuantity, 0);
        const available = total - reserved;
        const cls =
          available <= 0
            ? "admin-stock--out"
            : available <= p.variants.reduce((sum, v) => sum + v.lowStockThreshold, 0)
              ? "admin-stock--low"
              : "admin-stock--ok";
        return (
          <span className={`admin-stock ${cls}`}>
            <span className="admin-stock__dot" />
            {available} / {total}
          </span>
        );
      },
    },
    {
      key: "featured",
      header: "Featured",
      render: (row) => {
        const p = row as unknown as Product;
        return (
          <button
            type="button"
            onClick={() => handleToggleFeatured(p)}
            title={p.featured ? "Featured on homepage (click to remove)" : "Not featured (click to feature)"}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: p.featured ? "var(--adm-accent-dark)" : "var(--adm-text-muted)",
              fontSize: "12px",
            }}
          >
            <Star size={14} fill={p.featured ? "currentColor" : "none"} />
            {p.featured ? "Featured" : "No"}
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const p = row as unknown as Product;
        return (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={() => handleOpenEdit(p)}
              title="Edit Product"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              style={{
                padding: "4px 8px",
                fontSize: "11px",
                color: p.availability === "AVAILABLE" ? "var(--adm-text-muted)" : "var(--adm-accent-dark)",
              }}
              onClick={() => handleToggleAvailability(p)}
              title={p.availability === "AVAILABLE" ? "Deactivate" : "Activate"}
            >
              {p.availability === "AVAILABLE" ? <EyeOff size={12} /> : <CheckCircle2 size={12} />}
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) return <LoadingState message="Loading products." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Products</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="admin-heading__status">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={handleOpenCreate}
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar__left">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search products..."
          />
          <div className="admin-filters">
            {["ALL", "AVAILABLE", "UNAVAILABLE", "PREORDER"].map((f) => (
              <button
                key={f}
                type="button"
                className={`admin-filter-chip${availabilityFilter === f ? " admin-filter-chip--active" : ""}`}
                onClick={() => {
                  setAvailabilityFilter(f);
                  setPage(1);
                }}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          heading="No products found."
          body={search ? "Try adjusting your search or filters." : "Products will appear here once created."}
        />
      ) : (
        <>
          <AdminDataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            rowKey={(row) => String(row.id)}
            emptyMessage="No products match your filters."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Product Create / Edit Modal */}
      <AdminModal
        open={isCreateOpen || Boolean(editingProduct)}
        title={editingProduct ? `Edit "${editingProduct.name}"` : "Add New Product"}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingProduct(null);
        }}
        wide
      >
        <form onSubmit={handleSaveProduct} style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: "4px" }}>
          {formError && (
            <div style={{ padding: "8px 12px", background: "rgba(164, 88, 77, 0.1)", border: "1px solid var(--adm-error)", color: "var(--adm-error)", borderRadius: "4px", marginBottom: "16px", fontSize: "12px" }}>
              {formError}
            </div>
          )}

          <div className="admin-form-row">
            <AdminFormField label="Product Name" required>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value, !editingProduct)}
                placeholder="e.g. Himalayan Shilajit Gold Grade 30g"
                required
              />
            </AdminFormField>
            <AdminFormField label="Slug" required>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. himalayan-shilajit-gold-grade-30g"
                required
              />
            </AdminFormField>
          </div>

          <div className="admin-form-row">
            <AdminFormField label="Category" required>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                required
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </AdminFormField>

            <AdminFormField label="Availability" required>
              <select
                value={formData.availability}
                onChange={(e) => setFormData((prev) => ({ ...prev, availability: e.target.value as "AVAILABLE" | "PREORDER" | "UNAVAILABLE" }))}
              >
                <option value="AVAILABLE">Available</option>
                <option value="PREORDER">Pre-order</option>
                <option value="UNAVAILABLE">Unavailable (Draft)</option>
              </select>
            </AdminFormField>
          </div>

          <div className="admin-form-row">
            <AdminFormField label="Price (PKR)" required>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                required
              />
            </AdminFormField>
            <AdminFormField label="Compare-At Price (PKR)">
              <input
                type="number"
                min="0"
                step="1"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, compareAtPrice: e.target.value ? Number(e.target.value) : "" }))}
                placeholder="Optional original price"
              />
            </AdminFormField>
          </div>

          <div className="admin-form-row">
            <AdminFormField label="Initial Stock Quantity" required>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.stockQuantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                required
              />
            </AdminFormField>
            <AdminFormField label="Low Stock Alert Threshold">
              <input
                type="number"
                min="0"
                step="1"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData((prev) => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
              />
            </AdminFormField>
          </div>

          <div className="admin-form-row">
            <AdminFormField label="Primary Image URL / Path">
              <input
                type="text"
                value={formData.imageSrc}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageSrc: e.target.value }))}
                placeholder="/images/premium.jpeg or full URL"
              />
              <span style={{ fontSize: "11px", color: "var(--adm-text-muted)", marginTop: "3px", display: "block" }}>
                Use relative path (e.g. /images/premium.jpeg) or web URL (https://...).
              </span>
            </AdminFormField>
            <AdminFormField label="Image Alt Text">
              <input
                type="text"
                value={formData.imageAlt}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageAlt: e.target.value }))}
                placeholder="Accessible image description"
              />
            </AdminFormField>
          </div>

          <AdminFormField label="Short Description">
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
              placeholder="Brief summary displayed on cards"
            />
          </AdminFormField>

          <AdminFormField label="Full Description">
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed product story, sourcing, lab verification, and usage..."
            />
          </AdminFormField>

          <div style={{ margin: "12px 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="product-featured"
              checked={formData.featured}
              onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
              style={{ width: "auto", cursor: "pointer" }}
            />
            <label htmlFor="product-featured" style={{ fontSize: "13px", cursor: "pointer", color: "var(--adm-text-primary)" }}>
              Feature this product on the storefront homepage
            </label>
          </div>

          <div className="admin-dialog__actions">
            <button
              type="button"
              className="admin-dialog__cancel"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingProduct(null);
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-dialog__confirm"
              disabled={submitting}
            >
              {submitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </AdminModal>
    </main>
  );
}
