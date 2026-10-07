import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { z } from "zod";

const META_GRAPH_API_VERSION = "v26.0";
const META_STATS_URL = "https://graph.facebook.com";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10 * 1000;
const MAX_RANGE_DAYS = 90;
const MAX_STATS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 - 1000;
const TRACKED_EVENT_ORDER = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo", "Purchase"];

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const metaAnalyticsQuerySchema = z.object({
  startDate: z.string().regex(datePattern, "startDate must use YYYY-MM-DD.").optional(),
  endDate: z.string().regex(datePattern, "endDate must use YYYY-MM-DD.").optional(),
});

export interface MetaAnalyticsQuery {
  startDate?: string;
  endDate?: string;
}

export interface MetaAnalyticsEvent {
  name: string;
  count: number;
}

export interface MetaAnalyticsTrendPoint {
  date: string;
  events: MetaAnalyticsEvent[];
}

export interface MetaAnalyticsResult {
  range: { start: string; end: string };
  events: MetaAnalyticsEvent[];
  trend: MetaAnalyticsTrendPoint[];
  fetchedAt: string;
}

interface CacheEntry {
  expiresAt: number;
  value: MetaAnalyticsResult;
}

interface MetaStatsRow {
  event?: unknown;
  name?: unknown;
  event_name?: unknown;
  count?: unknown;
  total?: unknown;
  event_count?: unknown;
  value?: unknown;
  timestamp?: unknown;
  start_time?: unknown;
  end_time?: unknown;
}

const cache = new Map<string, CacheEntry>();

function utcDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseUtcDate(value: string, field: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || utcDateString(date) !== value) {
    throw new AppError(400, `${field} is not a valid calendar date.`, "INVALID_DATE_RANGE");
  }
  return date;
}

function resolveRange(query: MetaAnalyticsQuery) {
  const today = parseUtcDate(utcDateString(new Date()), "endDate");
  const end = query.endDate ? parseUtcDate(query.endDate, "endDate") : today;
  const start = query.startDate ? parseUtcDate(query.startDate, "startDate") : new Date(end.getTime() - 27 * 24 * 60 * 60 * 1000);

  if (end > today) throw new AppError(400, "endDate cannot be in the future.", "INVALID_DATE_RANGE");
  if (start > end) throw new AppError(400, "startDate must be on or before endDate.", "INVALID_DATE_RANGE");
  const rangeDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (rangeDays > MAX_RANGE_DAYS) throw new AppError(400, `The date range cannot exceed ${MAX_RANGE_DAYS} days.`, "INVALID_DATE_RANGE");
  return { start, end, startLabel: utcDateString(start), endLabel: utcDateString(end) };
}

function windowsForRange(start: Date, end: Date) {
  const windows: Array<{ start: Date; end: Date }> = [];
  const effectiveEnd = new Date(Math.min(end.getTime() + 24 * 60 * 60 * 1000 - 1000, Date.now()));
  let cursor = start;
  while (cursor <= effectiveEnd) {
    const windowEnd = new Date(Math.min(effectiveEnd.getTime(), cursor.getTime() + MAX_STATS_WINDOW_MS));
    windows.push({ start: cursor, end: windowEnd });
    cursor = new Date(windowEnd.getTime() + 1000);
  }
  return windows;
}

function numberFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function eventNameFrom(row: MetaStatsRow) {
  const value = row.event ?? row.name ?? row.event_name;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function eventCountFrom(row: MetaStatsRow) {
  return numberFrom(row.count) ?? numberFrom(row.total) ?? numberFrom(row.event_count) ?? numberFrom(row.value);
}

function trendDateFrom(row: MetaStatsRow) {
  const value = row.timestamp ?? row.start_time ?? row.end_time;
  if (typeof value === "number" && Number.isFinite(value)) return utcDateString(new Date(value > 10_000_000_000 ? value : value * 1000));
  if (typeof value === "string") {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return utcDateString(date);
  }
  return undefined;
}

function rowsFromResponse(body: unknown): MetaStatsRow[] {
  if (!body || typeof body !== "object") throw new AppError(502, "Meta returned an unexpected analytics response.", "META_INVALID_RESPONSE");
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) throw new AppError(502, "Meta returned an unexpected analytics response.", "META_INVALID_RESPONSE");
  if (!data.every((row) => row && typeof row === "object")) throw new AppError(502, "Meta returned an unexpected analytics response.", "META_INVALID_RESPONSE");
  return data as MetaStatsRow[];
}

async function fetchStats(windowStart: Date, windowEnd: Date) {
  if (!env.META_PIXEL_ID || !env.META_ACCESS_TOKEN) throw new AppError(503, "Meta analytics is not configured.", "META_ANALYTICS_NOT_CONFIGURED");

  const url = new URL(`${META_STATS_URL}/${META_GRAPH_API_VERSION}/${encodeURIComponent(env.META_PIXEL_ID)}/stats`);
  url.searchParams.set("aggregation", "event");
  url.searchParams.set("start_time", windowStart.toISOString());
  url.searchParams.set("end_time", windowEnd.toISOString());
  url.searchParams.set("access_token", env.META_ACCESS_TOKEN);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new AppError(502, "Meta analytics authorization failed.", "META_AUTHORIZATION_FAILED");
      if (response.status === 429) throw new AppError(503, "Meta analytics is temporarily rate limited.", "META_RATE_LIMITED");
      throw new AppError(502, "Meta analytics could not be retrieved.", "META_API_ERROR");
    }
    return rowsFromResponse(body);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new AppError(504, "Meta analytics timed out.", "META_TIMEOUT");
    throw new AppError(502, "Meta analytics could not be retrieved.", "META_API_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}

export async function getMetaAnalytics(query: MetaAnalyticsQuery): Promise<MetaAnalyticsResult> {
  const range = resolveRange(query);
  const cacheKey = `${range.startLabel}:${range.endLabel}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const eventCounts = new Map<string, number>();
  const trendCounts = new Map<string, Map<string, number>>();
  for (const window of windowsForRange(range.start, range.end)) {
    const rows = await fetchStats(window.start, window.end);
    for (const row of rows) {
      const name = eventNameFrom(row);
      const count = eventCountFrom(row);
      if (!name || count === undefined || count < 0) continue;
      eventCounts.set(name, (eventCounts.get(name) ?? 0) + count);
      const date = trendDateFrom(row);
      if (date) {
        const day = trendCounts.get(date) ?? new Map<string, number>();
        day.set(name, (day.get(name) ?? 0) + count);
        trendCounts.set(date, day);
      }
    }
  }

  const events = [...eventCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => (TRACKED_EVENT_ORDER.indexOf(left.name) - TRACKED_EVENT_ORDER.indexOf(right.name)) || right.count - left.count);
  const trend = [...trendCounts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, counts]) => ({ date, events: [...counts.entries()].map(([name, count]) => ({ name, count })) }));
  const result = { range: { start: range.startLabel, end: range.endLabel }, events, trend, fetchedAt: new Date().toISOString() };
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: result });
  return result;
}

export function clearMetaAnalyticsCache() {
  cache.clear();
}
