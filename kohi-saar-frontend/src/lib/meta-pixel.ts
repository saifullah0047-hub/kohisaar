import { hasAnalyticsConsent } from "@/lib/analytics";

export type MetaPixelFunction = {
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

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

function getConsentedFbq() {
  if (typeof window === "undefined" || !META_PIXEL_ID || !hasAnalyticsConsent()) return undefined;
  return window.fbq;
}

export function fbqTrack(event: string, data?: Record<string, unknown>, eventId?: string) {
  const fbq = getConsentedFbq();
  if (!fbq) return;
  if (eventId) fbq("track", event, data ?? {}, { eventID: eventId });
  else if (data) fbq("track", event, data);
  else fbq("track", event);
}

export function fbqTrackCustom(event: string, data?: Record<string, unknown>, eventId?: string) {
  const fbq = getConsentedFbq();
  if (!fbq) return;
  if (eventId) fbq("trackCustom", event, data ?? {}, { eventID: eventId });
  else if (data) fbq("trackCustom", event, data);
  else fbq("trackCustom", event);
}
