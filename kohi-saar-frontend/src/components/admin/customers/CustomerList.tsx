"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import {
  AdminDataTable,
  type Column,
  SearchInput,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/admin/ui";

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
}

const PAGE_SIZE = 20;

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: Customer[] }>("/admin/customers")
      .then((res) => { if (!cancelled) setCustomers(res.data); })
      .catch(() => { if (!cancelled) setError("Failed to load customers."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryToken]);

  const load = () => setRetryToken((t) => t + 1);

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "fullName",
      header: "Name",
      render: (row) => (
        <strong style={{ fontWeight: 400 }}>{String(row.fullName)}</strong>
      ),
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => String(row.phone ?? "—"),
    },
    {
      key: "orderCount",
      header: "Orders",
      render: (row) => String(row.orderCount),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (row) => new Date(String(row.createdAt)).toLocaleDateString(),
    },
  ];

  if (loading) return <LoadingState message="Loading customers." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">People</p>
          <h1>Customers</h1>
        </div>
        <span className="admin-heading__status">
          {customers.length} customer{customers.length !== 1 ? "s" : ""}
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
            placeholder="Search by name, email, or phone..."
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          heading="No customers found."
          body={search ? "Try adjusting your search." : "Customer accounts will appear here."}
        />
      ) : (
        <>
          <AdminDataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            rowKey={(row) => String(row.id)}
            emptyMessage="No customers match your search."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </main>
  );
}
