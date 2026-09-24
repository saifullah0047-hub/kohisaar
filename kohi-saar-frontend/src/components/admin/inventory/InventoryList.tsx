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
  AdminModal,
  AdminForm,
  AdminFormField,
} from "@/components/admin/ui";

interface Variant {
  id: string;
  name: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  availableQuantity: number;
}

interface Product {
  id: string;
  name: string;
  variants: Variant[];
}

const PAGE_SIZE = 20;

export function InventoryList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);
  const [adjustTarget, setAdjustTarget] = useState<{ product: Product; variant: Variant } | null>(null);
  const [adjustValue, setAdjustValue] = useState("0");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ data: Product[] }>("/admin/products")
      .then((res) => { if (!cancelled) setProducts(res.data); })
      .catch(() => { if (!cancelled) setError("Failed to load inventory."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryToken]);

  const load = () => setRetryToken((t) => t + 1);

  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, productName: p.name, product: p })),
  );

  const filtered = allVariants.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.productName.toLowerCase().includes(q) ||
      v.name.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdjust = async () => {
    if (!adjustTarget) return;
    const stockDelta = Number(adjustValue);
    if (!Number.isInteger(stockDelta)) return;
    setAdjusting(true);
    try {
      await adminApi.patch(`/admin/inventory/${adjustTarget.variant.id}`, { stockDelta });
      setAdjustTarget(null);
      setAdjustValue("0");
      load();
    } catch {
      setError("Stock adjustment failed.");
    } finally {
      setAdjusting(false);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: "productName",
      header: "Product",
      render: (row) => (
        <strong style={{ fontWeight: 400 }}>{String(row.productName)}</strong>
      ),
    },
    {
      key: "name",
      header: "Variant",
    },
    {
      key: "stockQuantity",
      header: "Stock",
      render: (row) => String(row.stockQuantity),
    },
    {
      key: "reservedQuantity",
      header: "Reserved",
      render: (row) => String(row.reservedQuantity),
    },
    {
      key: "availableQuantity",
      header: "Available",
      render: (row) => {
        const v = row as unknown as Variant;
        const cls =
          v.availableQuantity <= 0
            ? "admin-stock--out"
            : v.availableQuantity <= v.lowStockThreshold
              ? "admin-stock--low"
              : "admin-stock--ok";
        return (
          <span className={`admin-stock ${cls}`}>
            <span className="admin-stock__dot" />
            {v.availableQuantity}
          </span>
        );
      },
    },
    {
      key: "lowStockThreshold",
      header: "Threshold",
      render: (row) => String(row.lowStockThreshold),
    },
    {
      key: "id",
      header: "",
      render: (row) => {
        const v = row as unknown as Variant & { productName: string };
        const product = products.find((p) => p.variants.some((vv) => vv.id === v.id));
        return (
          <button
            type="button"
            className="admin-btn admin-btn--sm"
            onClick={() => {
              if (product) setAdjustTarget({ product, variant: v });
              setAdjustValue("0");
            }}
          >
            Adjust
          </button>
        );
      },
    },
  ];

  if (loading) return <LoadingState message="Loading inventory." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <main className="admin-content">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Inventory</h1>
        </div>
        <span className="admin-heading__status">
          {allVariants.length} variant{allVariants.length !== 1 ? "s" : ""}
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
            placeholder="Search products or variants..."
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          heading="No inventory records."
          body="Inventory will appear here once products with variants exist."
        />
      ) : (
        <>
          <AdminDataTable
            columns={columns}
            data={paginated as unknown as Record<string, unknown>[]}
            rowKey={(row) => String(row.id)}
            emptyMessage="No variants match your search."
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <AdminModal
        open={!!adjustTarget}
        title="Adjust Stock"
        onClose={() => setAdjustTarget(null)}
      >
        {adjustTarget && (
          <AdminForm
            onSubmit={handleAdjust}
            footer={
              <>
                <button
                  type="button"
                  className="admin-dialog__cancel"
                  onClick={() => setAdjustTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-dialog__confirm"
                  disabled={adjusting}
                >
                  {adjusting ? "Saving..." : "Apply"}
                </button>
              </>
            }
          >
            <p style={{ margin: 0, color: "#625e54", fontSize: "var(--type-small)" }}>
              {adjustTarget.product.name} — {adjustTarget.variant.name}
            </p>
            <p style={{ margin: "0.5rem 0 0", color: "#81785f", fontSize: "var(--type-caption)" }}>
              Current stock: {adjustTarget.variant.stockQuantity} | Available: {adjustTarget.variant.availableQuantity}
            </p>
            <AdminFormField label="Stock adjustment (negative to remove)" required>
              <input
                type="number"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder="0"
              />
            </AdminFormField>
          </AdminForm>
        )}
      </AdminModal>
    </main>
  );
}
