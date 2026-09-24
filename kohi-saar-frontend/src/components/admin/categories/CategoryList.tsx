"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin-api";
import {
  AdminDataTable,
  type Column,
  AdminModal,
  ConfirmDialog,
  AdminFormField,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/ui";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: "", slug: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: Category[] }>("/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load categories.");
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
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData({ name: val, slug: generatedSlug });
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: "", slug: "" });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, slug: cat.slug });
    setFormError(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setFormError("Name and slug are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingCategory) {
        await adminApi.patch(`/categories/${editingCategory.id}`, {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
        });
        setEditingCategory(null);
      } else {
        await adminApi.post("/categories", {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
        });
        setIsCreateOpen(false);
      }
      load();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setFormError(body?.message || `Failed to save category (${err.statusText})`);
      } else {
        setFormError("Failed to save category. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await adminApi.delete(`/categories/${deletingCategory.id}`);
      setDeletingCategory(null);
      load();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        alert(body?.message || "Could not delete category.");
      } else {
        alert("Failed to delete category.");
      }
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Category Name",
      render: (row) => (
        <div>
          <strong style={{ fontWeight: 500, color: "var(--adm-text-primary)" }}>{String(row.name)}</strong>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug / Route",
      render: (row) => (
        <span style={{ color: "var(--adm-accent-dark)", fontFamily: "monospace", fontSize: "12px" }}>
          /{String(row.slug)}
        </span>
      ),
    },
    {
      key: "products",
      header: "Products",
      render: (row) => {
        const cat = row as unknown as Category;
        const count = cat._count?.products ?? 0;
        return (
          <span style={{ fontSize: "12px", color: "var(--adm-text-secondary)" }}>
            {count} product{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const cat = row as unknown as Category;
        return (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={() => handleOpenEdit(cat)}
              title="Edit Category"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              style={{ padding: "4px 8px", fontSize: "11px", color: "var(--adm-error)" }}
              onClick={() => setDeletingCategory(cat)}
              title="Delete Category"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) return <LoadingState message="Loading categories." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Categories</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="admin-heading__status">
            {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
          </span>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={handleOpenCreate}
          >
            <Plus size={14} /> Add Category
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          heading="No categories yet."
          body="Create your first catalog category to organize your products."
        />
      ) : (
        <AdminDataTable
          columns={columns}
          data={categories as unknown as Record<string, unknown>[]}
          rowKey={(row) => String(row.id)}
          emptyMessage="No categories found."
        />
      )}

      {/* Create Modal */}
      <AdminModal
        open={isCreateOpen}
        title="Add Category"
        onClose={() => setIsCreateOpen(false)}
      >
        <form onSubmit={handleSaveCategory}>
          {formError && (
            <div style={{ padding: "8px 12px", background: "rgba(164, 88, 77, 0.1)", border: "1px solid var(--adm-error)", color: "var(--adm-error)", borderRadius: "4px", marginBottom: "16px", fontSize: "12px" }}>
              {formError}
            </div>
          )}
          <AdminFormField label="Category Name" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value, true)}
              placeholder="e.g. Shilajit Resin"
              required
            />
          </AdminFormField>
          <AdminFormField label="Category Slug" required>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="e.g. shilajit-resin"
              required
            />
          </AdminFormField>
          <div className="admin-dialog__actions">
            <button
              type="button"
              className="admin-dialog__cancel"
              onClick={() => setIsCreateOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-dialog__confirm"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Create Category"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Modal */}
      <AdminModal
        open={Boolean(editingCategory)}
        title="Edit Category"
        onClose={() => setEditingCategory(null)}
      >
        <form onSubmit={handleSaveCategory}>
          {formError && (
            <div style={{ padding: "8px 12px", background: "rgba(164, 88, 77, 0.1)", border: "1px solid var(--adm-error)", color: "var(--adm-error)", borderRadius: "4px", marginBottom: "16px", fontSize: "12px" }}>
              {formError}
            </div>
          )}
          <AdminFormField label="Category Name" required>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value, false)}
              required
            />
          </AdminFormField>
          <AdminFormField label="Category Slug" required>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
            />
          </AdminFormField>
          <div className="admin-dialog__actions">
            <button
              type="button"
              className="admin-dialog__cancel"
              onClick={() => setEditingCategory(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-dialog__confirm"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? If there are products associated with this category, the deletion will be rejected.`}
        confirmLabel="Delete Category"
        danger
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
      />
    </main>
  );
}
