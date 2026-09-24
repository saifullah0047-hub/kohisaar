"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { adminApi, ApiError } from "@/lib/admin-api";
import {
  AdminDataTable,
  type Column,
  StatusBadge,
  AdminModal,
  ConfirmDialog,
  AdminFormField,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/ui";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function FaqList() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<Faq | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    sortOrder: 0,
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: Faq[] }>("/admin/content/faqs")
      .then((res) => {
        if (!cancelled) setFaqs(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load FAQs.");
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
    setFormData({
      question: "",
      answer: "",
      sortOrder: faqs.length,
      isActive: true,
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
    });
    setFormError(null);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      setFormError("Both question and answer are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const payload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      sortOrder: Number(formData.sortOrder),
      isActive: Boolean(formData.isActive),
    };

    try {
      if (editingFaq) {
        await adminApi.patch(`/admin/content/faqs/${editingFaq.id}`, payload);
        setEditingFaq(null);
      } else {
        await adminApi.post("/admin/content/faqs", payload);
        setIsCreateOpen(false);
      }
      load();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setFormError(body?.message || `Failed to save FAQ (${err.statusText})`);
      } else {
        setFormError("Failed to save FAQ.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaq = async () => {
    if (!deletingFaq) return;
    try {
      await adminApi.delete(`/admin/content/faqs/${deletingFaq.id}`);
      setDeletingFaq(null);
      load();
    } catch {
      alert("Failed to delete FAQ.");
    }
  };

  const handleToggleActive = async (faq: Faq) => {
    try {
      await adminApi.patch(`/admin/content/faqs/${faq.id}`, {
        isActive: !faq.isActive,
      });
      load();
    } catch {
      alert("Failed to toggle FAQ status.");
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "sortOrder",
      header: "Order",
      render: (row) => (
        <span style={{ fontFamily: "monospace", color: "var(--adm-text-muted)" }}>
          #{String(row.sortOrder)}
        </span>
      ),
    },
    {
      key: "question",
      header: "Question",
      render: (row) => (
        <div>
          <strong style={{ fontWeight: 500, color: "var(--adm-text-primary)" }}>{String(row.question)}</strong>
        </div>
      ),
    },
    {
      key: "answer",
      header: "Answer",
      render: (row) => (
        <span
          style={{
            color: "var(--adm-text-secondary)",
            maxWidth: "360px",
            display: "inline-block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "12px",
          }}
        >
          {String(row.answer)}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => {
        const faq = row as unknown as Faq;
        return (
          <button
            type="button"
            onClick={() => handleToggleActive(faq)}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
            title="Click to toggle status"
          >
            <StatusBadge status={faq.isActive ? "ACTIVE" : "INACTIVE"} />
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const faq = row as unknown as Faq;
        return (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={() => handleOpenEdit(faq)}
              title="Edit FAQ"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--outline"
              style={{ padding: "4px 8px", fontSize: "11px", color: "var(--adm-error)" }}
              onClick={() => setDeletingFaq(faq)}
              title="Delete FAQ"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) return <LoadingState message="Loading FAQs." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Content</p>
          <h1>FAQs</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="admin-heading__status">
            {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            className="adm-btn adm-btn--primary"
            onClick={handleOpenCreate}
          >
            <Plus size={14} /> Add FAQ
          </button>
        </div>
      </div>

      {faqs.length === 0 ? (
        <EmptyState
          heading="No FAQs yet."
          body="Add common customer questions to display live on the storefront FAQ section."
        />
      ) : (
        <AdminDataTable
          columns={columns}
          data={faqs as unknown as Record<string, unknown>[]}
          rowKey={(row) => String(row.id)}
          emptyMessage="No FAQs found."
        />
      )}

      {/* FAQ Create / Edit Modal */}
      <AdminModal
        open={isCreateOpen || Boolean(editingFaq)}
        title={editingFaq ? "Edit FAQ" : "Add FAQ"}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingFaq(null);
        }}
      >
        <form onSubmit={handleSaveFaq}>
          {formError && (
            <div style={{ padding: "8px 12px", background: "rgba(164, 88, 77, 0.1)", border: "1px solid var(--adm-error)", color: "var(--adm-error)", borderRadius: "4px", marginBottom: "16px", fontSize: "12px" }}>
              {formError}
            </div>
          )}

          <AdminFormField label="Question" required>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
              placeholder="e.g. How do I consume Kohisaar Shilajit?"
              required
            />
          </AdminFormField>

          <AdminFormField label="Answer" required>
            <textarea
              rows={4}
              value={formData.answer}
              onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
              placeholder="Detailed answer..."
              required
            />
          </AdminFormField>

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
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: "auto" }}
                />
                Published (Active)
              </label>
            </div>
          </div>

          <div className="admin-dialog__actions">
            <button
              type="button"
              className="admin-dialog__cancel"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingFaq(null);
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
              {submitting ? "Saving..." : editingFaq ? "Save Changes" : "Create FAQ"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingFaq)}
        title="Delete FAQ"
        message={`Are you sure you want to delete this FAQ: "${deletingFaq?.question}"?`}
        confirmLabel="Delete FAQ"
        danger
        onConfirm={handleDeleteFaq}
        onCancel={() => setDeletingFaq(null)}
      />
    </main>
  );
}
