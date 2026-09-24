export type EcommerceEvent = "page_view" | "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
export interface AnalyticsItem { itemId: string; itemName: string; price?: number; quantity?: number; currency?: string; }
export interface AnalyticsPayload { items?: AnalyticsItem[]; value?: number; currency?: string; order_id?: string; }
export interface AnalyticsProvider { track: (event: EcommerceEvent, payload?: AnalyticsPayload) => void; }

const defaultProvider: AnalyticsProvider = {
  track(event, payload) {
    if (typeof window === "undefined") return;
    const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
    if (Array.isArray(dataLayer)) dataLayer.push({ event, ecommerce: payload });
  },
};
let provider = defaultProvider;
const CONSENT_KEY = "kohi-saar-analytics-consent";
let metaPixelId: string | undefined;
let metaPixelProviderConfigured = false;
let metaPixelInitializedId: string | undefined;

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

export function configureAnalyticsProvider(nextProvider: AnalyticsProvider) { provider = nextProvider; }
export function setAnalyticsConsent(granted: boolean) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    if (granted && metaPixelId) loadMetaPixel(metaPixelId);
  } catch { /* Analytics remains disabled when storage is unavailable. */ }
}
export function hasAnalyticsConsent() { try { return typeof window !== "undefined" && window.localStorage.getItem(CONSENT_KEY) === "granted"; } catch { return false; } }

export function registerMetaPixel(pixelId: string) {
  const normalizedPixelId = pixelId.trim();
  if (!normalizedPixelId || typeof window === "undefined") return;
  metaPixelId = normalizedPixelId;

  if (!metaPixelProviderConfigured) {
    const existingProvider = provider;
    configureAnalyticsProvider({
      track(event, payload) {
        existingProvider.track(event, payload);
        if (window.fbq) trackMetaEvent(window.fbq, event, payload);
      },
    });
    metaPixelProviderConfigured = true;
  }

  if (hasAnalyticsConsent()) loadMetaPixel(normalizedPixelId);
}

function loadMetaPixel(pixelId: string) {
  if (typeof window === "undefined") return;

  if (!window.fbq) {
    const fbq: MetaPixelFunction = (...args) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue?.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;
  }

  if (!window.fbq) return;
  if (!document.getElementById("kohi-saar-meta-pixel")) {
    const script = document.createElement("script");
    script.id = "kohi-saar-meta-pixel";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  if (metaPixelInitializedId !== pixelId) {
    window.fbq("init", pixelId);
    metaPixelInitializedId = pixelId;
  }
}

function trackMetaEvent(fbq: MetaPixelFunction, event: EcommerceEvent, payload?: AnalyticsPayload) {
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

  if (event === "page_view") fbq("track", "PageView");
  else if (event === "view_item") fbq("track", "ViewContent", customData);
  else if (event === "add_to_cart") fbq("track", "AddToCart", customData);
  else if (event === "begin_checkout") fbq("track", "InitiateCheckout", customData);
  else fbq("track", "Purchase", customData);
}

export function track(event: EcommerceEvent, payload?: Parameters<AnalyticsProvider["track"]>[1]) { if (hasAnalyticsConsent()) provider.track(event, payload); }
