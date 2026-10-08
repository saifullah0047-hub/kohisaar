import type { MetaPixelFunction } from "@/lib/meta-pixel";

export type EcommerceEvent = "page_view" | "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
export interface AnalyticsItem { itemId: string; itemName: string; price?: number; quantity?: number; currency?: string; }
export interface AnalyticsPayload { items?: AnalyticsItem[]; value?: number; currency?: string; order_id?: string; }
export interface AnalyticsProvider { track: (event: EcommerceEvent, payload?: AnalyticsPayload, eventId?: string) => void; }
export type AnalyticsConsent = "granted" | "denied" | undefined;

const defaultProvider: AnalyticsProvider = {
  track(event, payload) {
    if (typeof window === "undefined") return;
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) dataLayer.push({ event, ecommerce: payload });
  },
};
let provider = defaultProvider;
const CONSENT_KEY = "kohi-saar-analytics-consent";
export const ANALYTICS_CONSENT_CHANGE_EVENT = "kohi-saar-analytics-consent-change";
let metaPixelProviderConfigured = false;

export function configureAnalyticsProvider(nextProvider: AnalyticsProvider) { provider = nextProvider; }
export function setAnalyticsConsent(granted: boolean) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_CHANGE_EVENT, { detail: { granted } }));
  } catch { /* Analytics remains disabled when storage is unavailable. */ }
}
export function getAnalyticsConsent(): AnalyticsConsent {
  try {
    if (typeof window === "undefined") return undefined;
    const consent = window.localStorage.getItem(CONSENT_KEY);
    return consent === "granted" || consent === "denied" ? consent : undefined;
  } catch { return undefined; }
}
export function hasAnalyticsConsent() { try { return typeof window !== "undefined" && window.localStorage.getItem(CONSENT_KEY) === "granted"; } catch { return false; } }

export function registerMetaPixel(pixelId: string) {
  const normalizedPixelId = pixelId.trim();
  if (!normalizedPixelId || typeof window === "undefined") return;

  if (!metaPixelProviderConfigured) {
    const existingProvider = provider;
    configureAnalyticsProvider({
      track(event, payload, eventId) {
        existingProvider.track(event, payload);
        if (hasAnalyticsConsent() && window.fbq) trackMetaEvent(window.fbq, event, payload, eventId);
      },
    });
    metaPixelProviderConfigured = true;
  }
}

function trackMetaEvent(fbq: MetaPixelFunction, event: EcommerceEvent, payload?: AnalyticsPayload, eventId?: string) {
  const contents = payload?.items?.map((item) => ({
    id: item.itemId,
    quantity: item.quantity ?? 1,
    ...(item.price !== undefined ? { item_price: item.price } : {}),
  }));
  const customData = {
    ...(contents?.length ? { content_ids: contents.map((item) => item.id), contents, content_type: "product" } : {}),
    ...(payload?.value !== undefined ? { value: payload.value } : {}),
    ...(payload?.currency ? { currency: payload.currency } : {}),
    ...(payload?.order_id ? { order_id: payload.order_id } : {}),
  };

  const pixelEvent = event === "page_view" ? "PageView" : event === "view_item" ? "ViewContent" : event === "add_to_cart" ? "AddToCart" : event === "begin_checkout" ? "InitiateCheckout" : "Purchase";
  if (eventId) fbq("track", pixelEvent, event === "page_view" ? {} : customData, { eventID: eventId });
  else if (event === "page_view") fbq("track", pixelEvent);
  else fbq("track", pixelEvent, customData);
}

export function track(event: EcommerceEvent, payload?: Parameters<AnalyticsProvider["track"]>[1], eventId?: string) { if (hasAnalyticsConsent()) provider.track(event, payload, eventId); }
