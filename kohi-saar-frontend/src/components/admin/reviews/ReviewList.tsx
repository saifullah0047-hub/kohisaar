"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import {
  AdminDataTable,
  type Column,
  StatusBadge,
  SearchInput,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/admin/ui";

interface Review {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  createdAt: string;
  product: { name: string; slug: string };
  user: { id: string; fullName: string; email: string } | null;
}

const PAGE_SIZE = 20;

export function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: Review[] }>("/admin/reviews")
      .then((res) => { if (!cancelled) setReviews(res.data); })
      .catch(() => { if (!cancelled) setError("Failed to load reviews."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryToken]);

  const load = () => setRetryToken((t) => t + 1);

  const moderate = async (review: Review, status: string) => {
    try {
      await adminApi.patch(`/admin/reviews/${review.id}/status`, { status });
      load();
    } catch {
      setError("Moderation action failed.");
    }
  };

  const filtered = reviews.filter((r) => {
    const matchesSearch =
      !search ||
      r.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.title && r.title.toLowerCase().includes(search.toLowerCase())) ||
      r.body.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "product",
      header: "Product",
      render: (row) => {
        const r = row as unknown as Review;
        return r.product.name;
      },
    },
    {
      key: "rating",
      header: "Rating",
      render: (row) => "★".repeat(Number(row.rating)) + "☆".repeat(5 - Number(row.rating)),
    },
    {
      key: "title",
      header: "Title",
      render: (row) => String(row.title ?? "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    {
      key: "user",
      header: "Reviewer",
      render: (row) => {
        const r = row as unknown as Review;
        return r.user?.fullName || r.user?.email || "Guest customer";
      },
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row) => new Date(String(row.createdAt)).toLocaleDateString(),
    },
    {
      key: "id",
      header: "Action",
      render: (row) => {
        const r = row as unknown as Review;
        if (r.status === "PENDING") {
          return (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--primary"
                onClick={() => moderate(r, "APPROVED")}
              >
                Approve
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--danger"
                onClick={() => moderate(r, "REJECTED")}
              >
                Reject
              </button>
            </div>
          );
        }
        return "—";
      },
    },
  ];

  if (loading) return <LoadingState message="Loading reviews." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Moderation</p>
          <h1>Reviews</h1>
        </div>
        <span className="admin-heading__status">
          {reviews.filter((r) => r.status === "PENDING").length} pending
        </span>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar__left">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search reviews..."
          />
          <div className="admin-filters">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
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
          heading="No reviews found."
          body={search || statusFilter !== "ALL" ? "Try adjusting your search or filters." : "Customer reviews will appear here."}
        />
      ) : (
        <>
          <AdminDataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            rowKey={(row) => String(row.id)}
            emptyMessage="No reviews match your filters."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </main>
  );
}
