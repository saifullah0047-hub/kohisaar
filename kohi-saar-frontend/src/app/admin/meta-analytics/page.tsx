"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, RefreshCw, ShieldAlert } from "lucide-react";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ApiError, adminApi } from "@/lib/admin-api";
import { ErrorState, LoadingState } from "@/components/admin/ui";

type RangePreset = "7D" | "28D" | "CUSTOM";

interface MetaEvent {
  name: string;
  count: number;
}

interface MetaTrendPoint {
  date: string;
  events: MetaEvent[];
}

interface MetaAnalyticsData {
  range: { start: string; end: string };
  events: MetaEvent[];
  trend: MetaTrendPoint[];
  fetchedAt: string;
}

const EVENT_CARDS = [
  { name: "PageView", label: "Page Views", color: "#536875" },
  { name: "ViewContent", label: "Product Views", color: "#A88B55" },
  { name: "AddToCart", label: "Add to Cart", color: "#4F6B55" },
  { name: "InitiateCheckout", label: "Checkouts", color: "#9A7540" },
  { name: "Purchase", label: "Purchases", color: "#8B4A43" },
] as const;

function utcDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return utcDateInput(date);
}

function rangeForPreset(preset: RangePreset, customStart: string, customEnd: string) {
  if (preset === "CUSTOM") return { startDate: customStart, endDate: customEnd };
  return { startDate: dateDaysAgo(preset === "7D" ? 6 : 27), endDate: utcDateInput(new Date()) };
}

function formatCount(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function formatRate(numerator: number, denominator: number) {
  if (!denominator) return "—";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function MetaAnalyticsPage() {
  const [preset, setPreset] = useState<RangePreset>("28D");
  const [customStart, setCustomStart] = useState(() => dateDaysAgo(27));
  const [customEnd, setCustomEnd] = useState(() => utcDateInput(new Date()));
  const [data, setData] = useState<MetaAnalyticsData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedRange = useMemo(() => rangeForPreset(preset, customStart, customEnd), [customEnd, customStart, preset]);
  const invalidCustomRange = preset === "CUSTOM" && (!customStart || !customEnd || customStart > customEnd);

  useEffect(() => {
    if (invalidCustomRange) return;

    const controller = new AbortController();
    const params = new URLSearchParams(selectedRange);
    adminApi.get<{ data: MetaAnalyticsData }>(`/admin/analytics/meta?${params.toString()}`, controller.signal)
      .then((response) => {
        setError(undefined);
        setData(response.data);
      })
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) setError(requestError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [customEnd, customStart, invalidCustomRange, preset, refreshKey, selectedRange]);

  const eventCounts = useMemo(() => new Map((data?.events ?? []).map((event) => [event.name, event.count])), [data]);
  const trend = useMemo(() => data?.trend.map((point) => ({
    date: point.date,
    label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${point.date}T00:00:00Z`)),
    ...Object.fromEntries(point.events.map((event) => [event.name, event.count])),
  })) ?? [], [data]);
  const pageViews = eventCounts.get("PageView") ?? 0;
  const addToCart = eventCounts.get("AddToCart") ?? 0;
  const checkouts = eventCounts.get("InitiateCheckout") ?? 0;
  const purchases = eventCounts.get("Purchase") ?? 0;

  if (invalidCustomRange) return <main className="admin-content meta-analytics-page"><ErrorState message="Choose a valid custom date range." /></main>;
  if (loading && !data) return <LoadingState message="Loading Meta event insights." />;
  if (error && !data) {
    const forbidden = error instanceof ApiError && (error.status === 401 || error.status === 403);
    if (forbidden) {
      return <main className="admin-content meta-analytics-page"><div className="meta-analytics__state"><ShieldAlert size={34} aria-hidden="true" /><h1>Meta Analytics access denied.</h1><p>Your admin session does not have permission to view Meta event data.</p></div></main>;
    }
    return <main className="admin-content meta-analytics-page"><ErrorState message={error instanceof Error ? error.message : "Meta event data could not be loaded."} onRetry={() => setRefreshKey((value) => value + 1)} /></main>;
  }
  if (!data) return <main className="admin-content meta-analytics-page"><ErrorState message="Meta event data is unavailable." onRetry={() => setRefreshKey((value) => value + 1)} /></main>;

  return (
    <main className="admin-content meta-analytics-page">
      <div className="admin-heading meta-analytics__heading">
        <div>
          <p className="eyebrow">Connected data</p>
          <h1>Meta Analytics</h1>
          <p className="meta-analytics__intro">Read-only event activity from the Kohisaar Meta dataset.</p>
        </div>
        <div className="meta-analytics__controls">
          <div className="meta-analytics__presets" aria-label="Meta Analytics date range">
            {(["7D", "28D", "CUSTOM"] as RangePreset[]).map((option) => (
              <button key={option} type="button" className={`meta-analytics__preset${preset === option ? " meta-analytics__preset--active" : ""}`} onClick={() => setPreset(option)}>
                {option === "CUSTOM" ? "Custom" : option === "7D" ? "7 days" : "28 days"}
              </button>
            ))}
          </div>
          <button className="meta-analytics__refresh" type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
            <RefreshCw size={14} className={loading ? "meta-analytics__refresh-icon--spinning" : undefined} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {preset === "CUSTOM" && (
        <div className="meta-analytics__custom-range">
          <label><CalendarDays size={14} aria-hidden="true" /> From <input type="date" value={customStart} max={customEnd} onChange={(event) => setCustomStart(event.target.value)} /></label>
          <label>To <input type="date" value={customEnd} min={customStart} max={utcDateInput(new Date())} onChange={(event) => setCustomEnd(event.target.value)} /></label>
        </div>
      )}

      <div className="meta-analytics__range-summary">
        <span>{formatDate(data.range.start)} – {formatDate(data.range.end)}</span>
        <span>Meta events only</span>
      </div>

      {data.events.length === 0 ? (
        <div className="meta-analytics__empty"><h2>No Meta events in this range.</h2><p>Try a wider date range or refresh the connection.</p></div>
      ) : (
        <>
          <div className="meta-analytics__cards">
            {EVENT_CARDS.map((card) => (
              <div className="meta-analytics__card" key={card.name}>
                <span className="meta-analytics__card-dot" style={{ background: card.color }} aria-hidden="true" />
                <span className="meta-analytics__card-label">{card.label}</span>
                <strong>{formatCount(eventCounts.get(card.name) ?? 0)}</strong>
              </div>
            ))}
          </div>

          <section className="adm-card meta-analytics__conversion-card" aria-labelledby="meta-conversion-heading">
            <div className="adm-card__header"><div><span className="adm-eyebrow">CALCULATED RATES</span><h2 id="meta-conversion-heading" className="adm-card__title">Event progression</h2></div><span className="meta-analytics__context">Dashboard calculations</span></div>
            <div className="meta-analytics__rates">
              <div><span>Add-to-cart rate</span><strong>{formatRate(addToCart, pageViews)}</strong><small>AddToCart / PageView</small></div>
              <div><span>Checkout rate</span><strong>{formatRate(checkouts, addToCart)}</strong><small>InitiateCheckout / AddToCart</small></div>
              <div><span>Purchase rate</span><strong>{formatRate(purchases, checkouts)}</strong><small>Purchase / InitiateCheckout</small></div>
            </div>
          </section>

          <section className="adm-card meta-analytics__trend-card" aria-labelledby="meta-trend-heading">
            <div className="adm-card__header"><div><span className="adm-eyebrow">EVENT VOLUME</span><h2 id="meta-trend-heading" className="adm-card__title">Meta event trend</h2></div><span className="meta-analytics__context">UTC daily buckets</span></div>
            {trend.length ? <div className="meta-analytics__trend"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}><CartesianGrid stroke="#DDD8CD" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#817C70", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} /><YAxis allowDecimals={false} tick={{ fill: "#817C70", fontSize: 11 }} tickLine={false} axisLine={false} width={42} /><Tooltip contentStyle={{ border: "1px solid #DDD8CD", borderRadius: 8, background: "#FBF9F5", color: "#1D1D1A" }} /><Legend wrapperStyle={{ fontSize: 11 }} />{EVENT_CARDS.map((event) => <Line key={event.name} type="monotone" dataKey={event.name} name={event.label} stroke={event.color} strokeWidth={2} dot={false} />)}</LineChart></ResponsiveContainer></div> : <p className="meta-analytics__empty-copy">Meta returned aggregate event totals without usable time buckets for this range.</p>}
          </section>

          <section className="adm-card meta-analytics__event-card" aria-labelledby="meta-events-heading">
            <div className="adm-card__header"><div><span className="adm-eyebrow">EVENT SUMMARY</span><h2 id="meta-events-heading" className="adm-card__title">All returned Meta events</h2></div><span className="meta-analytics__context">Dataset activity</span></div>
            <div className="meta-analytics__event-list">{data.events.map((event) => <div className="meta-analytics__event-row" key={event.name}><span>{event.name}</span><strong>{formatCount(event.count)}</strong></div>)}</div>
          </section>
        </>
      )}

      <div className="meta-analytics__footer"><span>Last updated {formatUpdated(data.fetchedAt)}</span><p>Meta event totals may include activity from connected data sources and may differ from Kohisaar store order totals.</p></div>
    </main>
  );
}
