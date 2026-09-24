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
  ConfirmDialog,
} from "@/components/admin/ui";

interface Order {
  orderNumber: string;
  email: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  payment: { method: string; status: string } | null;
}

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

const PAGE_SIZE = 20;

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: Order[] }>("/admin/orders")
      .then((res) => { if (!cancelled) setOrders(res.data); })
      .catch(() => { if (!cancelled) setError("Failed to load orders."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryToken]);

  const load = () => setRetryToken((t) => t + 1);

  const changeStatus = async (order: Order, status: string) => {
    if (status === "CANCELLED") {
      setConfirmCancel(order);
      return;
    }
    try {
      await adminApi.patch(`/orders/${encodeURIComponent(order.orderNumber)}/status`, { status });
      load();
    } catch {
      setError("Status change failed.");
    }
  };

  const confirmCancelOrder = async () => {
    if (!confirmCancel) return;
    try {
      await adminApi.patch(`/orders/${encodeURIComponent(confirmCancel.orderNumber)}/status`, {
        status: "CANCELLED",
      });
      setConfirmCancel(null);
      load();
    } catch {
      setError("Cancellation failed.");
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "orderNumber",
      header: "Order",
      render: (row) => (
        <strong style={{ fontWeight: 400 }}>{String(row.orderNumber)}</strong>
      ),
    },
    {
      key: "email",
      header: "Customer",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    {
      key: "total",
      header: "Total",
      render: (row) => {
        const o = row as unknown as Order;
        return `${o.currency} ${o.total.toLocaleString()}`;
      },
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) => {
        const o = row as unknown as Order;
        return o.payment ? `${o.payment.method.replace("_", " ")} — ${o.payment.status}` : "—";
      },
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row) => new Date(String(row.createdAt)).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Action",
      render: (row) => {
        const o = row as unknown as Order;
        return (
          <select
            className="admin-inline-select"
            value={o.status}
            onChange={(e) => changeStatus(o, e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        );
      },
    },
  ];

  if (loading) return <LoadingState message="Loading orders." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Commerce</p>
          <h1>Orders</h1>
        </div>
        <span className="admin-heading__status">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
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
            placeholder="Search by order number or email..."
          />
          <div className="admin-filters">
            <button
              type="button"
              className={`admin-filter-chip${statusFilter === "ALL" ? " admin-filter-chip--active" : ""}`}
              onClick={() => { setStatusFilter("ALL"); setPage(1); }}
            >
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`admin-filter-chip${statusFilter === s ? " admin-filter-chip--active" : ""}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          heading="No orders found."
          body={search || statusFilter !== "ALL" ? "Try adjusting your search or filters." : "Orders will appear here when customers begin to purchase."}
        />
      ) : (
        <>
          <AdminDataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            rowKey={(row) => String(row.orderNumber)}
            emptyMessage="No orders match your filters."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={!!confirmCancel}
        title="Cancel Order"
        message={`Cancel order ${confirmCancel?.orderNumber}? This will release its reserved inventory and cannot be undone.`}
        confirmLabel="Cancel Order"
        danger
        onConfirm={confirmCancelOrder}
        onCancel={() => setConfirmCancel(null)}
      />
    </main>
  );
}
