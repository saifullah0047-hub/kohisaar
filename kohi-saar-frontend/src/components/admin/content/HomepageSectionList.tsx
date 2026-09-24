"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin-api";
import {
  AdminDataTable,
  type Column,
  StatusBadge,
  AdminModal,
  AdminFormField,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/ui";

interface Section {
  id: string;
  key: string;
  eyebrow: string | null;
  title: string | null;
  body: string | null;
  imageSrc: string | null;
  imageAlt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export function HomepageSectionList() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    eyebrow: "",
    title: "",
    body: "",
    imageSrc: "",
    imageAlt: "",
    ctaLabel: "",
    ctaHref: "",
    sortOrder: 0,
    isPublished: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: Section[] }>("/admin/content/homepage")
      .then((res) => {
        if (!cancelled) setSections(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load homepage sections.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const load = () => setRetryToken((t) => t + 1);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      key: "",
      eyebrow: "",
      title: "",
      body: "",
      imageSrc: "",
      imageAlt: "",
      ctaLabel: "",
      ctaHref: "",
      sortOrder: sections.length,
      isPublished: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sec: Section) => {
    setIsEditing(true);
    setFormData({
      key: sec.key,
      eyebrow: sec.eyebrow || "",
      title: sec.title || "",
      body: sec.body || "",
      imageSrc: sec.imageSrc || "",
      imageAlt: sec.imageAlt || "",
      ctaLabel: sec.ctaLabel || "",
      ctaHref: sec.ctaHref || "",
      sortOrder: sec.sortOrder,
      isPublished: sec.isPublished,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key.trim()) {
      setFormError("Section key is required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const payload = {
      eyebrow: formData.eyebrow.trim() || undefined,
      title: formData.title.trim() || undefined,
      body: formData.body.trim() || undefined,
      imageSrc: formData.imageSrc.trim() || undefined,
      imageAlt: formData.imageAlt.trim() || undefined,
      ctaLabel: formData.ctaLabel.trim() || undefined,
      ctaHref: formData.ctaHref.trim() || undefined,
      sortOrder: Number(formData.sortOrder),
      isPublished: Boolean(formData.isPublished),
    };

    try {
      await adminApi.put(`/admin/content/homepage/${encodeURIComponent(formData.key.trim())}`, payload);
      setIsModalOpen(false);
      load();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setFormError(body?.message || `Failed to save section (${err.statusText})`);
      } else {
        setFormError("Failed to save homepage section.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublished = async (sec: Section) => {
    try {
      await adminApi.put(`/admin/content/homepage/${encodeURIComponent(sec.key)}`, {
        isPublished: !sec.isPublished,
      });
      load();
    } catch {
      alert("Failed to toggle section status.");
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "sortOrder",
      header: "#",
      render: (row) => (
        <span style={{ fontFamily: "monospace", color: "var(--adm-text-muted)" }}>
          #{String(row.sortOrder)}
        </span>
      ),
    },
    {
      key: "key",
      header: "Section Key",
      render: (row) => (
        <strong style={{ fontWeight: 500, fontFamily: "monospace", color: "var(--adm-accent-dark)" }}>
          {String(row.key)}
        </strong>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <span style={{ color: "var(--adm-text-primary)", fontWeight: 500 }}>
          {String(row.title ?? "—")}
        </span>
      ),
    },
    {
      key: "eyebrow",
      header: "Eyebrow",
      render: (row) => (
        <span style={{ color: "var(--adm-text-muted)", fontSize: "12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {String(row.eyebrow ?? "—")}
        </span>
      ),
    },
    {
      key: "isPublished",
      header: "Status",
      render: (row) => {
        const sec = row as unknown as Section;
        return (
          <button
            type="button"
            onClick={() => handleTogglePublished(sec)}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
            title="Click to toggle publish status"
          >
            <StatusBadge status={sec.isPublished ? "PUBLISHED" : "DRAFT"} />
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const sec = row as unknown as Section;
        return (
          <button
            type="button"
            className="adm-btn adm-btn--outline"
            style={{ padding: "4px 8px", fontSize: "11px" }}
            onClick={() => handleOpenEdit(sec)}
            title="Edit Section"
          >
            <Edit2 size={12} /> Edit
          </button>
        );
      },
    },
  ];

  if (loading) return <LoadingState message="Loading homepage sections." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Content</p>
          <h1>Homepage Sections</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="admin-heading__status">
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={handleOpenCreate}
          >
            <Plus size={14} /> New Section
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <EmptyState
          heading="No homepage sections."
          body="Sections will appear here once created."
        />
      ) : (
        <AdminDataTable
          columns={columns}
          data={sections as unknown as Record<string, unknown>[]}
          rowKey={(row) => String(row.id)}
          emptyMessage="No sections found."
        />
      )}

      {/* Section Create / Edit Modal */}
      <AdminModal
        open={isModalOpen}
        title={isEditing ? `Edit Section "${formData.key}"` : "Add Homepage Section"}
        onClose={() => setIsModalOpen(false)}
        wide
      >
        <form onSubmit={handleSaveSection} style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: "4px" }}>
          {formError && (
            <div style={{ padding: "8px 12px", background: "rgba(164, 88, 77, 0.1)", border: "1px solid var(--adm-error)", color: "var(--adm-error)", borderRadius: "4px", marginBottom: "16px", fontSize: "12px" }}>
              {formError}
            </div>
          )}

          <div className="admin-form-row">
            <AdminFormField label="Section Key" required>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="e.g. hero, purity, story, harvest"
                disabled={isEditing}
                required
              />
            </AdminFormField>
            <AdminFormField label="Eyebrow Subtitle">
              <input
                type="text"
                value={formData.eyebrow}
                onChange={(e) => setFormData((prev) => ({ ...prev, eyebrow: e.target.value }))}
                placeholder="e.g. HIMALAYAN SOURCING"
              />
            </AdminFormField>
          </div>

          <AdminFormField label="Section Title">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Harvested at 18,000 Feet"
            />
          </AdminFormField>

          <AdminFormField label="Body Copy">
            <textarea
              rows={4}
              value={formData.body}
              onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="Detailed editorial copy..."
            />
          </AdminFormField>

          <div className="admin-form-row">
            <AdminFormField label="Image URL / Path">
              <input
                type="text"
                value={formData.imageSrc}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageSrc: e.target.value }))}
                placeholder="/images/premium.jpeg"
              />
            </AdminFormField>
            <AdminFormField label="Image Alt Text">
              <input
                type="text"
                value={formData.imageAlt}
                onChange={(e) => setFormData((prev) => ({ ...prev, imageAlt: e.target.value }))}
                placeholder="Description of image"
              />
            </AdminFormField>
          </div>

          <div className="admin-form-row">
            <AdminFormField label="CTA Button Label">
              <input
                type="text"
                value={formData.ctaLabel}
                onChange={(e) => setFormData((prev) => ({ ...prev, ctaLabel: e.target.value }))}
                placeholder="e.g. Discover The Harvest"
              />
            </AdminFormField>
            <AdminFormField label="CTA Destination URL">
              <input
                type="text"
                value={formData.ctaHref}
                onChange={(e) => setFormData((prev) => ({ ...prev, ctaHref: e.target.value }))}
                placeholder="e.g. /story or /shop"
              />
            </AdminFormField>
          </div>

          <div className="admin-form-row">
            <AdminFormField label="Display Order">
              <input
                type="number"
                min="0"
                step="1"
                value={formData.sortOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
              />
            </AdminFormField>

            <div style={{ display: "flex", alignItems: "center", paddingTop: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isPublished: e.target.checked }))}
                  style={{ width: "auto" }}
                />
                Published (Live on site)
              </label>
            </div>
          </div>

          <div className="admin-dialog__actions">
            <button
              type="button"
              className="admin-dialog__cancel"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-dialog__confirm"
              disabled={submitting}
            >
              {submitting ? "Saving..." : isEditing ? "Update Section" : "Create Section"}
            </button>
          </div>
        </form>
      </AdminModal>
    </main>
  );
}
