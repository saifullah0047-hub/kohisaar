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

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { id: string; email: string } | null;
}

const PAGE_SIZE = 20;

export function AuditLogList() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: AuditLog[] }>("/admin/audit-logs")
      .then((res) => { if (!cancelled) setLogs(res.data); })
      .catch(() => { if (!cancelled) setError("Failed to load audit logs."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryToken]);

  const load = () => setRetryToken((t) => t + 1);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      (l.user?.email.toLowerCase().includes(q) ?? false) ||
      (l.entityId && l.entityId.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "createdAt",
      header: "Time",
      render: (row) => {
        const d = new Date(String(row.createdAt));
        return d.toLocaleString();
      },
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <strong style={{ fontWeight: 400 }}>{String(row.action)}</strong>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (row) => String(row.entity),
    },
    {
      key: "entityId",
      header: "Entity ID",
      render: (row) => (
        <span style={{ color: "#81785f", fontFamily: "monospace", fontSize: "var(--type-caption)" }}>
          {String(row.entityId ?? "—")}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (row) => {
        const l = row as unknown as AuditLog;
        return l.user?.email ?? "System";
      },
    },
  ];

  if (loading) return <LoadingState message="Loading audit logs." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">System</p>
          <h1>Audit Logs</h1>
        </div>
        <span className="admin-heading__status">
          {logs.length} log{logs.length !== 1 ? "s" : ""}
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
            placeholder="Search logs..."
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          heading="No audit logs found."
          body={search ? "Try adjusting your search." : "Audit logs will appear here as admin actions are performed."}
        />
      ) : (
        <>
          <AdminDataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            rowKey={(row) => String(row.id)}
            emptyMessage="No logs match your search."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </main>
  );
}
