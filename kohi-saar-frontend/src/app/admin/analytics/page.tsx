"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminApi } from "@/lib/admin-api";
import { ErrorState, LoadingState, StatusBadge } from "@/components/admin/ui";

type DateRange = "7D" | "30D" | "MONTH";

interface AnalyticsOrder {
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

interface AnalyticsData {
  counts: { products: number; categories: number; orders: number; customers: number; reviews: number };
  revenueTotal?: number;
  recentOrders: AnalyticsOrder[];
}

const RANGE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: "7D", label: "7 days" },
  { value: "30D", label: "30 days" },
  { value: "MONTH", label: "This month" },
];

const STATUS_COLORS = ["#A88B55", "#536875", "#4F6B55", "#9A7540", "#8B4A43", "#817C70", "#6B6253"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getRangeStart(range: DateRange, today: Date) {
  const start = startOfDay(today);
  if (range === "MONTH") return new Date(start.getFullYear(), start.getMonth(), 1);
  start.setDate(start.getDate() - (range === "7D" ? 6 : 29));
  return start;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatStatus(status: string) {
  return status.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${value.toLocaleString()}`;
}

function buildTrend(orders: AnalyticsOrder[], range: DateRange, currency: string) {
  const today = startOfDay(new Date());
  const start = getRangeStart(range, today);
  const buckets = new Map<string, { date: string; label: string; revenue: number; orders: number }>();

  for (const cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const key = dateKey(cursor);
    buckets.set(key, {
      date: key,
      label: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: 0,
      orders: 0,
    });
  }

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt);
    const key = dateKey(createdAt);
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket.orders += 1;
    if (order.currency === currency && order.status !== "CANCELLED" && order.status !== "RETURNED") {
      bucket.revenue += Number(order.total) || 0;
    }
  });

  return [...buckets.values()];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>();
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [range, setRange] = useState<DateRange>("30D");
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    Promise.all([
      adminApi.get<{ data: AnalyticsData }>("/admin/dashboard", controller.signal),
      adminApi.get<{ data: AnalyticsOrder[] }>("/admin/orders", controller.signal).catch(() => null),
    ]).then(([dashboardResponse, ordersResponse]) => {
      if (cancelled) return;
      setData(dashboardResponse.data);
      setOrders(ordersResponse?.data ?? dashboardResponse.data.recentOrders);
    }).catch((requestError: unknown) => {
      if (!cancelled && !(requestError instanceof DOMException && requestError.name === "AbortError")) setError(true);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const currency = useMemo(() => orders[0]?.currency ?? data?.recentOrders[0]?.currency ?? "PKR", [data, orders]);
  const trend = useMemo(() => buildTrend(orders, range, currency), [orders, range, currency]);
  const statusData = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((order) => counts.set(order.status, (counts.get(order.status) ?? 0) + 1));
    return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders]);

  if (error) return <ErrorState message="Analytics data could not be loaded." onRetry={() => window.location.reload()} />;
  if (!data) return <LoadingState message="Loading store insights." />;

  return (
    <main className="admin-content admin-analytics-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Insights</p>
          <h1>Analytics</h1>
          <p className="admin-analytics__intro">A clear view of store activity, order momentum, and current fulfilment mix.</p>
        </div>
        <div className="admin-analytics__controls">
          <span className="admin-heading__status">Live order data</span>
          <div className="admin-analytics__range" aria-label="Analytics date range">
            {RANGE_OPTIONS.map((option) => (
              <button key={option.value} type="button" className={range === option.value ? "admin-analytics__range-button admin-analytics__range-button--active" : "admin-analytics__range-button"} onClick={() => setRange(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-stat-row__secondary admin-analytics__stats">
        {[
          ["Revenue", `${data.recentOrders[0]?.currency ?? currency} ${(data.revenueTotal ?? 0).toLocaleString()}`],
          ["Orders", String(data.counts.orders)],
          ["Customers", String(data.counts.customers)],
          ["Reviews", String(data.counts.reviews)],
        ].map(([label, value]) => (
          <div className="adm-stat-card" key={label}>
            <span className="adm-stat-card__accent" aria-hidden="true" />
            <span className="adm-stat-card__label">{label}</span>
            <span className="adm-stat-card__value">{value}</span>
          </div>
        ))}
      </div>

      <section className="adm-card admin-analytics__chart-card">
        <div className="adm-card__header">
          <div><span className="adm-eyebrow">REVENUE</span><h2 className="adm-card__title">Revenue trend</h2></div>
          <span className="admin-analytics__context">{RANGE_OPTIONS.find((option) => option.value === range)?.label}</span>
        </div>
        <div className="admin-analytics__chart" aria-label="Revenue trend chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A88B55" stopOpacity={0.32} /><stop offset="100%" stopColor="#A88B55" stopOpacity={0.03} /></linearGradient></defs>
              <CartesianGrid stroke="#DDD8CD" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#817C70", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tick={{ fill: "#817C70", fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(value: number) => value.toLocaleString()} />
              <Tooltip contentStyle={{ border: "1px solid #DDD8CD", borderRadius: 8, background: "#FBF9F5", color: "#1D1D1A" }} formatter={(value) => [formatMoney(Number(value) || 0, currency), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#A88B55" strokeWidth={2} fill="url(#revenueFill)" activeDot={{ r: 5, fill: "#A88B55", stroke: "#FBF9F5", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="admin-analytics__grid">
        <section className="adm-card admin-analytics__chart-card">
          <div className="adm-card__header"><div><span className="adm-eyebrow">VOLUME</span><h2 className="adm-card__title">Orders trend</h2></div><span className="admin-analytics__context">Orders per day</span></div>
          <div className="admin-analytics__chart admin-analytics__chart--compact" aria-label="Orders trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#DDD8CD" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#817C70", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fill: "#817C70", fontSize: 11 }} tickLine={false} axisLine={false} width={24} />
                <Tooltip contentStyle={{ border: "1px solid #DDD8CD", borderRadius: 8, background: "#FBF9F5", color: "#1D1D1A" }} formatter={(value) => [Number(value) || 0, "Orders"]} />
                <Bar dataKey="orders" fill="#536875" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="adm-card admin-analytics__chart-card">
          <div className="adm-card__header"><div><span className="adm-eyebrow">FULFILMENT</span><h2 className="adm-card__title">Order status</h2></div><span className="admin-analytics__context">All recorded orders</span></div>
          {statusData.length ? <div className="admin-analytics__status-layout">
            <div className="admin-analytics__donut" aria-label="Order status breakdown chart">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius="57%" outerRadius="82%" paddingAngle={3} stroke="none">{statusData.map((entry, index) => <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ border: "1px solid #DDD8CD", borderRadius: 8, background: "#FBF9F5", color: "#1D1D1A" }} formatter={(value) => [Number(value) || 0, "Orders"]} /></PieChart></ResponsiveContainer>
            </div>
            <div className="admin-analytics__legend">{statusData.map((entry, index) => <div className="admin-analytics__legend-row" key={entry.name}><span className="admin-analytics__legend-dot" style={{ background: STATUS_COLORS[index % STATUS_COLORS.length] }} /><span>{formatStatus(entry.name)}</span><strong>{entry.value}</strong></div>)}</div>
          </div> : <p className="admin-analytics__empty">No order statuses are available yet.</p>}
        </section>
      </div>

      <section className="adm-card">
        <div className="adm-card__header"><div><span className="adm-eyebrow">COMMERCE</span><h2 className="adm-card__title">Recent order performance</h2></div><span className="admin-analytics__context">Latest {data.recentOrders.length}</span></div>
        <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>ORDER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.orderNumber}><td>{order.orderNumber}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>{order.currency} {order.total.toLocaleString()}</td><td><StatusBadge status={order.status} /></td></tr>)}</tbody></table></div>
      </section>

      <p className="admin-analytics__note">Top product performance is not shown because the existing list endpoint does not include order items. Adding it accurately would require a dedicated aggregated analytics endpoint rather than extra per-order requests.</p>
    </main>
  );
}
