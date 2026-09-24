"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin-api";
import {
  AdminDataTable,
  type Column,
  StatusBadge,
  SearchInput,
  AdminModal,
  ConfirmDialog,
  AdminFormField,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/admin/ui";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZE = 20;

export function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    excerpt: "",
    body: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: Article[] }>("/admin/content/articles")
      .then((res) => {
        if (!cancelled) setArticles(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load articles.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const load = () => setRetryToken((t) => t + 1);

  const handleTitleChange = (val: string, isCreate: boolean) => {
    if (isCreate) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, title: val, slug }));
    } else {
      setFormData((prev) => ({ ...prev, title: val }));
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      title: "",
      slug: "",
      status: "PUBLISHED",
      excerpt: "",
      body: "",
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      status: article.status,
      excerpt: article.excerpt || "",
      body: article.body,
    });
    setFormError(null);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim() || !formData.body.trim()) {
      setFormError("Title, slug, and article body are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      status: formData.status,
      excerpt: formData.excerpt.trim() || undefined,
      body: formData.body.trim(),
    };

    try {
      if (editingArticle) {
        await adminApi.patch(`/admin/content/articles/${editingArticle.id}`, payload);
        setEditingArticle(null);
      } else {
        await adminApi.post("/admin/content/articles", payload);
        setIsCreateOpen(false);
      }
      load();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setFormError(body?.message || `Failed to save article (${err.statusText})`);
      } else {
        setFormError("Failed to save article.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!deletingArticle) return;
    try {
      await adminApi.delete(`/admin/content/articles/${deletingArticle.id}`);
      setDeletingArticle(null);
      load();
    } catch {
      alert("Failed to delete article.");
    }
  };

  const filtered = articles.filter((a) => {
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <div>
          <strong style={{ fontWeight: 500, color: "var(--adm-text-primary)" }}>{String(row.title)}</strong>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug / URL",
      render: (row) => (
        <span style={{ color: "var(--adm-accent-dark)", fontFamily: "monospace", fontSize: "11px" }}>
          /journal/{String(row.slug)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    {
      key: "publishedAt",
      header: "Published",
      render: (row) =>
        row.publishedAt
          ? new Date(String(row.publishedAt)).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const article = row as unknown as Article;
        return (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={() => handleOpenEdit(article)}
              title="Edit Article"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              style={{ padding: "4px 8px", fontSize: "11px", color: "var(--adm-error)" }}
              onClick={() => setDeletingArticle(article)}
              title="Delete Article"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) return <LoadingState message="Loading articles." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Content</p>
          <h1>Journal Articles</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="admin-heading__status">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={handleOpenCreate}
          >
            <Plus size={14} /> New Article
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
            placeholder="Search articles..."
          />
          <div className="admin-filters">
            {["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"].map((f) => (
              <button
                key={f}
                type="button"
                className={`admin-filter-chip${statusFilter === f ? " admin-filter-chip--active" : ""}`}
                onClick={() => {
                  setStatusFilter(f);
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
          heading="No articles found."
          body={
            search || statusFilter !== "ALL"
              ? "Try adjusting your search or filters."
              : "Articles will appear here once created."
          }
        />
      ) : (
        <>
          <AdminDataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            rowKey={(row) => String(row.id)}
            emptyMessage="No articles match your filters."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Article Create / Edit Modal */}
      <AdminModal
        open={isCreateOpen || Boolean(editingArticle)}
        title={editingArticle ? `Edit "${editingArticle.title}"` : "New Journal Article"}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingArticle(null);
        }}
        wide
      >
        <form onSubmit={handleSaveArticle} style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: "4px" }}>
          {formError && (
            <div style={{ padding: "8px 12px", background: "rgba(164, 88, 77, 0.1)", border: "1px solid var(--adm-error)", color: "var(--adm-error)", borderRadius: "4px", marginBottom: "16px", fontSize: "12px" }}>
              {formError}
            </div>
          )}

          <div className="admin-form-row">
            <AdminFormField label="Article Title" required>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value, !editingArticle)}
                placeholder="e.g. The Science of High-Altitude Resin Extraction"
                required
              />
            </AdminFormField>
            <AdminFormField label="URL Slug" required>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. science-high-altitude-resin-extraction"
                required
              />
            </AdminFormField>
          </div>

          <AdminFormField label="Publication Status" required>
            <select
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" }))}
            >
              <option value="PUBLISHED">Published (Live on storefront)</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </AdminFormField>

          <AdminFormField label="Excerpt / Summary">
            <input
              type="text"
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Short introductory hook shown on journal listings"
            />
          </AdminFormField>

          <AdminFormField label="Article Body (Full Editorial Text)" required>
            <textarea
              rows={8}
              value={formData.body}
              onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="Write the article content..."
              required
            />
          </AdminFormField>

          <div className="admin-dialog__actions">
            <button
              type="button"
              className="admin-dialog__cancel"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingArticle(null);
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
              {submitting ? "Saving..." : editingArticle ? "Update Article" : "Publish Article"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingArticle)}
        title="Delete Article"
        message={`Are you sure you want to delete "${deletingArticle?.title}"? This cannot be undone.`}
        confirmLabel="Delete Article"
        danger
        onConfirm={handleDeleteArticle}
        onCancel={() => setDeletingArticle(null)}
      />
    </main>
  );
}
