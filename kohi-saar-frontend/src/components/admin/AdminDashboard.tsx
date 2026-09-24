"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  ShoppingCart,
  Users,
  ArrowRight,
  ExternalLink,
  BarChart3,
  ClipboardList,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { StatusBadge, LoadingState, ErrorState } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";
import { sanitizeImageSrc } from "@/lib/image-utils";

/* ── Image Mapping for Kohisaar Real Catalog ── */
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "kohi-saar-premium-shilajit-resin": "/images/premium.jpeg",
  "shilajit-resin-100g": "/images/100 gram.jpeg",
  "shilajit-resin-50g": "/images/50 gram.jpeg",
  "shilajit-resin-30g": "/images/30 gram.jpeg",
  "shilajit-resin-15g": "/images/15 gram.jpeg",
  "shilajit-resin-8g": "/images/8 gram.jpeg",
  "gold-grade-resin-30g": "/images/Gold grade.jpeg",
};

function resolveProductImage(productOrSlug: Product | string, name?: string): string {
  let result = "/images/premium.jpeg";
  if (typeof productOrSlug === "object") {
    if (productOrSlug.images && productOrSlug.images.length > 0 && productOrSlug.images[0].src) {
      result = productOrSlug.images[0].src;
    } else {
      result = resolveProductImage(productOrSlug.slug, productOrSlug.name);
    }
  } else {
    const slug = productOrSlug;
    if (PRODUCT_IMAGE_MAP[slug]) {
      result = PRODUCT_IMAGE_MAP[slug];
    } else {
      const found = Object.entries(PRODUCT_IMAGE_MAP).find(
        ([k]) => slug.includes(k) || k.includes(slug),
      );
      if (found) {
        result = found[1];
      } else if (name) {
        const lower = name.toLowerCase();
        if (lower.includes("100g") || lower.includes("100 g")) result = "/images/100 gram.jpeg";
        else if (lower.includes("50g") || lower.includes("50 g")) result = "/images/50 gram.jpeg";
        else if (lower.includes("30g") || lower.includes("30 g")) result = "/images/30 gram.jpeg";
        else if (lower.includes("15g") || lower.includes("15 g")) result = "/images/15 gram.jpeg";
        else if (lower.includes("8g") || lower.includes("8 g")) result = "/images/8 gram.jpeg";
        else if (lower.includes("gold")) result = "/images/Gold grade.jpeg";
      }
    }
  }
  return sanitizeImageSrc(result);
}

/* ── Types ── */

interface DashboardCounts {
  products: number;
  categories: number;
  orders: number;
  customers: number;
  reviews: number;
}

interface RecentOrder {
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  email?: string;
}

interface DashboardData {
  counts: DashboardCounts;
  revenueTotal?: number;
  recentOrders: RecentOrder[];
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  currency: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  availableQuantity: number;
}

interface ProductImage {
  src: string;
  alt: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  availability: string;
  featured: boolean;
  category: { name: string };
  variants: ProductVariant[];
  images?: ProductImage[];
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: { id: string; email: string } | null;
}

/* ── Helpers ── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  return "Good evening.";
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatLeadingZero(n: number): string {
  return n < 10 && n >= 0 ? `0${n}` : `${n}`;
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData>();
  const [products, setProducts] = useState<Product[]>();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>();
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D" | "1Y">("30D");

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    Promise.all([
      adminApi.get<{ data: DashboardData }>("/admin/dashboard", signal),
      adminApi.get<{ data: Product[] }>("/admin/products", signal),
      adminApi.get<{ data: AuditLog[] }>("/admin/audit-logs", signal),
    ])
      .then(([dashRes, prodRes, logRes]) => {
        setData(dashRes.data);
        setProducts(prodRes.data);
        setAuditLogs(logRes.data);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Dashboard data could not be loaded from server.");
      });

    return () => controller.abort();
  }, [retryToken]);

  const reload = () => {
    setError(null);
    setData(undefined);
    setProducts(undefined);
    setAuditLogs(undefined);
    setRetryToken((t) => t + 1);
  };

  /* ── Derived Analytics & Inventory Data ── */

  const revenueTotal = useMemo(() => {
    if (typeof data?.revenueTotal === "number") return data.revenueTotal;
    if (!data?.recentOrders) return 0;
    return data.recentOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  }, [data]);

  const currencyCode = useMemo(() => {
    if (data?.recentOrders && data.recentOrders.length > 0) {
      return data.recentOrders[0].currency;
    }
    if (products && products[0]?.variants[0]?.currency) {
      return products[0].variants[0].currency;
    }
    return "PKR";
  }, [data, products]);

  const allVariants = useMemo(() => {
    if (!products) return [];
    return products.flatMap((p) =>
      p.variants.map((v) => ({ ...v, productName: p.name, productSlug: p.slug })),
    );
  }, [products]);

  const inStockCount = useMemo(() => {
    return allVariants.filter((v) => v.availableQuantity > v.lowStockThreshold).length;
  }, [allVariants]);

  const lowStockVariants = useMemo(() => {
    return allVariants.filter(
      (v) => v.availableQuantity > 0 && v.availableQuantity <= v.lowStockThreshold,
    );
  }, [allVariants]);

  const outOfStockVariants = useMemo(() => {
    return allVariants.filter((v) => v.availableQuantity <= 0);
  }, [allVariants]);

  const recentProductsList = useMemo(() => {
    if (!products) return [];
    return products.slice(0, 5);
  }, [products]);

  const recentAuditList = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs.slice(0, 6);
  }, [auditLogs]);

  const salesBuckets = useMemo(() => {
    const buckets = { today: 0, thisWeek: 0, lastWeek: 0, earlier: 0 };
    if (!data?.recentOrders) return buckets;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    data.recentOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const total = Number(o.total) || 0;
      if (d >= startOfToday) buckets.today += total;
      else if (d >= startOfThisWeek) buckets.thisWeek += total;
      else if (d >= startOfLastWeek) buckets.lastWeek += total;
      else buckets.earlier += total;
    });
    return buckets;
  }, [data]);

  const salesBarData = useMemo(() => {
    return [
      { label: "Today", value: salesBuckets.today },
      { label: "This week", value: salesBuckets.thisWeek },
      { label: "Last week", value: salesBuckets.lastWeek },
      { label: "Earlier", value: salesBuckets.earlier },
    ];
  }, [salesBuckets]);

  const maxBarValue = useMemo(() => Math.max(...salesBarData.map((b) => b.value), 1), [salesBarData]);

  if (error) {
    return (
      <main className="admin-content">
        <ErrorState message={error} onRetry={reload} />
      </main>
    );
  }

  if (!data || !products || !auditLogs) {
    return (
      <main className="admin-content">
        <LoadingState message="Loading store operations." />
      </main>
    );
  }

  const currentDateFormatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date()).toUpperCase();

  return (
    <main className="admin-content">
      {/* ── 1. EDITORIAL HEADER ── */}
      <header className="adm-header">
        <div className="adm-header__content">
          <p className="adm-eyebrow">OVERVIEW</p>
          <h1 className="adm-header__title">{getGreeting()}</h1>
          <p className="adm-header__subheading">
            A clear view of Kohisaar&apos;s commerce and operations.
          </p>
        </div>

        <div className="adm-header__meta">
          <div className="adm-header__date-chip">
            <Calendar size={13} strokeWidth={1.75} />
            <span>{currentDateFormatted}</span>
          </div>
          <div className="adm-header__range-pill">
            <span>Last 30 days</span>
            <span className="adm-header__range-arrow">▾</span>
          </div>
        </div>
      </header>

      {/* ── 2. STAT ROW ── */}
      <div className="adm-stat-row">
        {/* Row 1: Secondary cards */}
        <div className="adm-stat-row__secondary">
          {/* Products */}
          <Link href="/admin/products" className="adm-stat-card">
            <span className="adm-stat-card__accent" aria-hidden="true" />
            <div className="adm-stat-card__head">
              <span className="adm-stat-card__badge" aria-hidden="true">
                <Package size={18} strokeWidth={1.5} />
              </span>
              <span className="adm-stat-card__label">Products</span>
            </div>
            <span className="adm-stat-card__value">{formatLeadingZero(data.counts.products)}</span>
            <span className="adm-stat-card__hairline" aria-hidden="true" />
            <span className="adm-stat-card__delta">—</span>{/* DELTA PLACEHOLDER */}
          </Link>

          {/* Orders */}
          <Link href="/admin/orders" className="adm-stat-card">
            <span className="adm-stat-card__accent" aria-hidden="true" />
            <div className="adm-stat-card__head">
              <span className="adm-stat-card__badge" aria-hidden="true">
                <ShoppingCart size={18} strokeWidth={1.5} />
              </span>
              <span className="adm-stat-card__label">Orders</span>
            </div>
            <span className="adm-stat-card__value">{formatLeadingZero(data.counts.orders)}</span>
            <span className="adm-stat-card__hairline" aria-hidden="true" />
            <span className="adm-stat-card__delta">—</span>{/* DELTA PLACEHOLDER */}
          </Link>

          {/* Customers */}
          <Link href="/admin/customers" className="adm-stat-card">
            <span className="adm-stat-card__accent" aria-hidden="true" />
            <div className="adm-stat-card__head">
              <span className="adm-stat-card__badge" aria-hidden="true">
                <Users size={18} strokeWidth={1.5} />
              </span>
              <span className="adm-stat-card__label">Customers</span>
            </div>
            <span className="adm-stat-card__value">{formatLeadingZero(data.counts.customers)}</span>
            <span className="adm-stat-card__hairline" aria-hidden="true" />
            <span className="adm-stat-card__delta">—</span>{/* DELTA PLACEHOLDER */}
          </Link>
        </div>
      </div>

      {/* ── 3 & 4. PRIMARY GRID: SALES PERFORMANCE + INVENTORY ── */}
      <div className="adm-grid-primary">
        {/* Sales Performance Panel */}
        <section className="adm-card adm-card--sales">
          <div className="adm-card__header">
            <div>
              <span className="adm-eyebrow">COMMERCE</span>
              <h2 className="adm-card__title">Sales Performance</h2>
            </div>
            <div className="adm-range-selector" role="group" aria-label="Time range">
              {(["7D", "30D", "90D", "1Y"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`adm-range-btn${timeRange === r ? " adm-range-btn--active" : ""}`}
                  aria-pressed={timeRange === r}
                  onClick={() => setTimeRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="adm-sales-hero">
            <div className="adm-sales-hero__figure">
              <span className="adm-sales-hero__currency">{currencyCode}</span>
              <span className="adm-sales-hero__amount">
                {revenueTotal.toLocaleString()}
              </span>
            </div>
            <p className="adm-sales-hero__sub">
              {data.counts.orders === 0
                ? "No sales recorded yet"
                : `${data.counts.orders} order${data.counts.orders === 1 ? "" : "s"} recorded`}
            </p>
          </div>

          <div className="adm-sales-divider" aria-hidden="true" />

          {revenueTotal > 0 ? (
            <ul className="adm-bar-list" aria-label="Sales by time period">
              {salesBarData.map((row) => {
                const pct = maxBarValue > 0 ? (row.value / maxBarValue) * 100 : 0;
                return (
                  <li key={row.label} className="adm-bar-row">
                    <span className="adm-bar-row__label">{row.label}</span>
                    <span className="adm-bar-row__track" aria-hidden="true">
                      <span
                        className="adm-bar-row__fill"
                        style={{ width: `${Math.max(pct, row.value > 0 ? 3 : 0)}%` }}
                      />
                    </span>
                    <span className="adm-bar-row__value">
                      {currencyCode} {row.value.toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="adm-sales-empty">
              <p className="adm-sales-empty__heading">No orders yet.</p>
              <p className="adm-sales-empty__body">
                Sales will appear here once orders begin.
              </p>
            </div>
          )}
        </section>

        {/* Inventory Panel */}
        <section className="adm-card adm-card--inventory">
          <div className="adm-card__header">
            <div>
              <span className="adm-eyebrow">LOGISTICS</span>
              <h2 className="adm-card__title">INVENTORY</h2>
            </div>
            <Link href="/admin/inventory" className="adm-card__link">
              <span>Manage</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Inventory Breakdown Trio */}
          <div className="adm-inv-strip">
            <div className="adm-inv-stat">
              <span className="adm-inv-stat__label">IN STOCK</span>
              <span className="adm-inv-stat__value adm-inv-stat__value--ok">
                {formatLeadingZero(inStockCount)}
              </span>
            </div>
            <div className="adm-inv-stat">
              <span className="adm-inv-stat__label">LOW STOCK</span>
              <span className="adm-inv-stat__value adm-inv-stat__value--warn">
                {formatLeadingZero(lowStockVariants.length)}
              </span>
            </div>
            <div className="adm-inv-stat">
              <span className="adm-inv-stat__label">OUT OF STOCK</span>
              <span className="adm-inv-stat__value adm-inv-stat__value--danger">
                {formatLeadingZero(outOfStockVariants.length)}
              </span>
            </div>
          </div>

          {/* Inventory Attention / Health Section */}
          <div className="adm-inv-attention">
            <div className="adm-inv-attention__header">
              <span className="adm-inv-attention__title">INVENTORY ATTENTION</span>
            </div>

            {lowStockVariants.length === 0 && outOfStockVariants.length === 0 ? (
              <div className="adm-inv-health">
                <CheckCircle2 size={16} className="adm-inv-health__icon" />
                <span>Your current catalogue is fully stocked.</span>
              </div>
            ) : (
              <div className="adm-inv-attention__list">
                {[...outOfStockVariants, ...lowStockVariants].slice(0, 4).map((item) => (
                  <div key={item.id} className="adm-inv-attention__row">
                    <div className="adm-inv-attention__product">
                      <strong className="adm-inv-attention__name">{item.productName}</strong>
                      <span className="adm-inv-attention__variant">{item.name}</span>
                    </div>
                    <div className="adm-inv-attention__status">
                      <span
                        className={`adm-inv-pill ${
                          item.availableQuantity <= 0
                            ? "adm-inv-pill--danger"
                            : "adm-inv-pill--warn"
                        }`}
                      >
                        {item.availableQuantity <= 0 ? "Out of stock" : "Low stock"}
                      </span>
                      <span className="adm-inv-attention__qty">
                        {item.availableQuantity} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="adm-card__footer">
            <Link href="/admin/inventory" className="adm-text-link">
              <span>Manage inventory</span>
              <ArrowRight size={12} className="adm-text-link__arrow" />
            </Link>
          </div>
        </section>
      </div>

      {/* ── 5 & 6. SECONDARY GRID: RECENT PRODUCTS + RECENT ORDERS + QUICK ACTIONS ── */}
      <div className="adm-grid-secondary">
        {/* Left Column: Recent Products & Recent Orders */}
        <div className="adm-grid-secondary__left">
          {/* Recent Products */}
          <section className="adm-card">
            <div className="adm-card__header">
              <div>
                <span className="adm-eyebrow">CATALOG</span>
                <h2 className="adm-card__title">RECENT PRODUCTS</h2>
              </div>
              <Link href="/admin/products" className="adm-card__link">
                <span>View all</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="adm-products-list">
              {recentProductsList.map((product) => {
                const img = resolveProductImage(product);
                const firstVariant = product.variants[0];
                const totalStock = product.variants.reduce(
                  (acc, v) => acc + v.availableQuantity,
                  0,
                );
                return (
                  <div key={product.id} className="adm-product-row">
                    {/* Square Thumbnail Frame */}
                    <div className="adm-product-row__frame">
                      <Image
                        src={img}
                        alt={product.name}
                        width={52}
                        height={52}
                        className="adm-product-row__img"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="adm-product-row__meta">
                      <strong className="adm-product-row__name">
                        {product.name}
                      </strong>
                      <span className="adm-product-row__cat">
                        {product.category?.name ?? "Shilajit"}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="adm-product-row__price">
                      {firstVariant
                        ? `${firstVariant.currency} ${firstVariant.price.toLocaleString()}`
                        : "—"}
                    </div>

                    {/* Stock & Status */}
                    <div className="adm-product-row__stock">
                      <span
                        className={`adm-stock-dot ${
                          totalStock <= 0
                            ? "adm-stock-dot--out"
                            : totalStock <= 3
                              ? "adm-stock-dot--low"
                              : "adm-stock-dot--ok"
                        }`}
                        aria-hidden="true"
                      />
                      <span>{totalStock} in stock</span>
                    </div>

                    <div className="adm-product-row__badge">
                      <StatusBadge status={product.availability} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="adm-card__footer">
              <Link href="/admin/products" className="adm-text-link">
                <span>View products</span>
                <ArrowRight size={12} className="adm-text-link__arrow" />
              </Link>
            </div>
          </section>

          {/* Recent Orders */}
          <section className="adm-card">
            <div className="adm-card__header">
              <div>
                <span className="adm-eyebrow">COMMERCE</span>
                <h2 className="adm-card__title">RECENT ORDERS</h2>
              </div>
              <Link href="/admin/orders" className="adm-card__link">
                <span>View orders</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {data.recentOrders && data.recentOrders.length > 0 ? (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th scope="col">ORDER</th>
                      <th scope="col">CUSTOMER</th>
                      <th scope="col">AMOUNT</th>
                      <th scope="col">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.slice(0, 5).map((order) => (
                      <tr key={order.orderNumber}>
                        <td>
                          <span className="adm-order-num">{order.orderNumber}</span>
                        </td>
                        <td className="adm-order-email">
                          {order.email ?? "Customer"}
                        </td>
                        <td className="adm-order-amount">
                          {order.currency} {order.total.toLocaleString()}
                        </td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="adm-empty-order">
                <div className="adm-empty-order__crest" aria-hidden="true">
                  <ShoppingCart size={22} strokeWidth={1.5} />
                </div>
                <h3 className="adm-empty-order__title">YOUR FIRST ORDER IS WAITING</h3>
                <p className="adm-empty-order__desc">
                  Once a customer places an order, your sales activity will appear here.
                </p>
                <div className="adm-empty-order__actions">
                  <Link href="/" className="adm-btn adm-btn--outline" target="_blank">
                    <ExternalLink size={12} strokeWidth={1.75} />
                    <span>View storefront</span>
                  </Link>
                  <Link href="/admin/products" className="adm-btn adm-btn--secondary">
                    <span>Manage products</span>
                    <ArrowRight size={12} strokeWidth={1.75} />
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Quick Actions & Recent Activity & Analytics Preview */}
        <aside className="adm-grid-secondary__right">
          {/* Quick Actions */}
          <div className="adm-card adm-card--actions">
            <div className="adm-card__header">
              <div>
                <span className="adm-eyebrow">CONTROL</span>
                <h2 className="adm-card__title">QUICK ACTIONS</h2>
              </div>
            </div>

            <nav className="adm-quick-links" aria-label="Quick operations">
              <Link href="/admin/products" className="adm-quick-link">
                <div className="adm-quick-link__content">
                  <span className="adm-quick-link__label">Add Product</span>
                  <span className="adm-quick-link__sub">Create catalogue entry</span>
                </div>
                <ArrowRight size={14} className="adm-quick-link__arrow" />
              </Link>

              <Link href="/admin/inventory" className="adm-quick-link">
                <div className="adm-quick-link__content">
                  <span className="adm-quick-link__label">Adjust Inventory</span>
                  <span className="adm-quick-link__sub">Update stock & thresholds</span>
                </div>
                <ArrowRight size={14} className="adm-quick-link__arrow" />
              </Link>

              <Link href="/admin/orders" className="adm-quick-link">
                <div className="adm-quick-link__content">
                  <span className="adm-quick-link__label">View Orders</span>
                  <span className="adm-quick-link__sub">Track customer fulfillment</span>
                </div>
                <ArrowRight size={14} className="adm-quick-link__arrow" />
              </Link>

              <Link href="/admin/analytics" className="adm-quick-link">
                <div className="adm-quick-link__content">
                  <span className="adm-quick-link__label">Analytics</span>
                  <span className="adm-quick-link__sub">Performance & tracking</span>
                </div>
                <ArrowRight size={14} className="adm-quick-link__arrow" />
              </Link>
            </nav>
          </div>

          {/* Recent Activity */}
          <div className="adm-card adm-card--activity">
            <div className="adm-card__header">
              <div>
                <span className="adm-eyebrow">AUDIT</span>
                <h2 className="adm-card__title">RECENT ACTIVITY</h2>
              </div>
              <Link href="/admin/audit-logs" className="adm-card__link">
                <span>View all</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {recentAuditList.length > 0 ? (
              <div className="adm-activity-timeline">
                {recentAuditList.map((log) => (
                  <div key={log.id} className="adm-activity-node">
                    <div className="adm-activity-node__dot" aria-hidden="true" />
                    <div className="adm-activity-node__body">
                      <span className="adm-activity-node__action">
                        {log.action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                      </span>
                      <span className="adm-activity-node__entity">
                        {log.entity}
                        {log.user ? ` · ${log.user.email}` : ""}
                      </span>
                    </div>
                    <time className="adm-activity-node__time">
                      {formatTimeAgo(log.createdAt)}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <div className="adm-empty-activity">
                <ClipboardList size={18} className="adm-empty-activity__icon" />
                <p className="adm-empty-activity__title">NO RECENT ACTIVITY</p>
                <p className="adm-empty-activity__desc">
                  Administrative activity will appear here as your store grows.
                </p>
              </div>
            )}
          </div>

          {/* Analytics Preview Card */}
          <div className="adm-card adm-card--analytics-preview">
            <div className="adm-card__header">
              <div>
                <span className="adm-eyebrow">INSIGHTS</span>
                <h2 className="adm-card__title">ANALYTICS PREVIEW</h2>
              </div>
              <BarChart3 size={15} style={{ color: "var(--adm-accent, #A88B55)" }} />
            </div>

            <div className="adm-analytics-summary">
              <div className="adm-analytics-metric">
                <span className="adm-analytics-metric__label">TOTAL ORDERS</span>
                <strong className="adm-analytics-metric__val">
                  {formatLeadingZero(data.counts.orders)}
                </strong>
              </div>
              <div className="adm-analytics-metric">
                <span className="adm-analytics-metric__label">ACTIVE CUSTOMERS</span>
                <strong className="adm-analytics-metric__val">
                  {formatLeadingZero(data.counts.customers)}
                </strong>
              </div>
              <div className="adm-analytics-metric">
                <span className="adm-analytics-metric__label">TOTAL REVIEWS</span>
                <strong className="adm-analytics-metric__val">
                  {formatLeadingZero(data.counts.reviews)}
                </strong>
              </div>
            </div>

            <div className="adm-card__footer">
              <Link href="/admin/analytics" className="adm-text-link">
                <span>View full analytics</span>
                <ArrowRight size={12} className="adm-text-link__arrow" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
