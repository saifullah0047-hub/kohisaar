"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_CONSENT_CHANGE_EVENT, getAnalyticsConsent, registerMetaPixel, track, type AnalyticsConsent } from "@/lib/analytics";

let lastTrackedPageView: string | undefined;

export function AnalyticsTracker() {
  const pathname = usePathname();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [consentRevision, setConsentRevision] = useState(0);

  useEffect(() => {
    if (pixelId) registerMetaPixel(pixelId);
    const consentTimer = window.setTimeout(() => setConsent(getAnalyticsConsent()), 0);

    const handleConsentChange = (event: Event) => {
      const granted = (event as CustomEvent<{ granted?: boolean }>).detail?.granted === true;
      setConsent(granted ? "granted" : "denied");
      setConsentRevision((revision) => revision + 1);
    };
    window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, handleConsentChange);
    return () => {
      window.clearTimeout(consentTimer);
      window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, handleConsentChange);
    };
  }, [pixelId]);

  useEffect(() => {
    if (consent !== "granted") return;
    const pageViewKey = `${consentRevision}:${pathname}`;
    if (lastTrackedPageView === pageViewKey) return;
    lastTrackedPageView = pageViewKey;
    track("page_view");
  }, [consent, consentRevision, pathname]);

  return null;
}
