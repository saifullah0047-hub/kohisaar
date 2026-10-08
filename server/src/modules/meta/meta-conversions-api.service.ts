import { createHash, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { env } from "../../config/env.js";

const META_CAPI_VERSION = "v20.0";
const META_CAPI_TIMEOUT_MS = 2_500;
const EVENT_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
let missingConfigurationWarningLogged = false;

export interface MetaConversionUserData {
  email?: string;
  phone?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}

export interface SendMetaConversionEventInput {
  eventName: string;
  eventTime?: number;
  eventId?: string;
  actionSource?: string;
  eventSourceUrl?: string;
  userData?: MetaConversionUserData;
  customData?: Record<string, unknown>;
}

export function sha256(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function buildUserData(input: MetaConversionUserData = {}) {
  const userData: Record<string, string | string[]> = {};
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone ? normalizePhone(input.phone) : "";
  const ipAddress = input.clientIpAddress?.trim();
  const userAgent = input.clientUserAgent?.trim();
  const fbp = input.fbp?.trim();
  const fbc = input.fbc?.trim();

  if (email) userData.em = [sha256(email)];
  if (phone) userData.ph = [sha256(phone)];
  if (ipAddress && isIP(ipAddress)) userData.client_ip_address = ipAddress;
  if (userAgent) userData.client_user_agent = userAgent.slice(0, 500);
  if (fbp) userData.fbp = fbp.slice(0, 500);
  if (fbc) userData.fbc = fbc.slice(0, 500);

  return userData;
}

function safeEventSourceUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

function metaErrorMessage(body: unknown) {
  if (!body || typeof body !== "object" || !("error" in body)) return undefined;
  const error = body.error;
  if (!error || typeof error !== "object" || !("message" in error)) return undefined;
  return typeof error.message === "string" ? error.message.slice(0, 300) : undefined;
}

export async function sendMetaConversionEvent(input: SendMetaConversionEventInput) {
  if (!env.META_PIXEL_ID || !env.META_CONVERSIONS_API_ACCESS_TOKEN) {
    if (!missingConfigurationWarningLogged) {
      console.warn("[Meta CAPI] Skipping events: set META_PIXEL_ID and META_CONVERSIONS_API_ACCESS_TOKEN in the server environment.");
      missingConfigurationWarningLogged = true;
    }
    return false;
  }

  const requestedEventId = input.eventId?.trim();
  const eventId = requestedEventId && EVENT_ID_PATTERN.test(requestedEventId) ? requestedEventId : randomUUID();
  const url = new URL(`https://graph.facebook.com/${META_CAPI_VERSION}/${encodeURIComponent(env.META_PIXEL_ID)}/events`);
  url.searchParams.set("access_token", env.META_CONVERSIONS_API_ACCESS_TOKEN);
  const eventSourceUrl = safeEventSourceUrl(input.eventSourceUrl);

  const event = {
    event_name: input.eventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: input.actionSource ?? "website",
    user_data: buildUserData(input.userData),
    ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
    ...(input.customData ? { custom_data: input.customData } : {}),
  };
  const payload = {
    data: [event],
    ...(env.META_TEST_EVENT_CODE ? { test_event_code: env.META_TEST_EVENT_CODE } : {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_CAPI_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      console.error(`[Meta CAPI] ${input.eventName} event failed with HTTP ${response.status}.`, metaErrorMessage(body));
      return false;
    }
    return true;
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "request timed out" : "request failed";
    console.error(`[Meta CAPI] ${input.eventName} ${reason}.`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
