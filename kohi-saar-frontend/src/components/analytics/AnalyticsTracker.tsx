"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ANALYTICS_CONSENT_CHANGE_EVENT, getAnalyticsConsent, registerMetaPixel, track, type AnalyticsConsent } from "@/lib/analytics";

import { META_PIXEL_ID } from "@/lib/meta-pixel";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const currentLocation = query ? `${pathname}?${query}` : pathname;
  const pixelId = META_PIXEL_ID;
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const lastSeenLocation = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (pixelId) registerMetaPixel(pixelId);
    const consentTimer = window.setTimeout(() => setConsent(getAnalyticsConsent()), 0);

    const handleConsentChange = (event: Event) => {
      const granted = (event as CustomEvent<{ granted?: boolean }>).detail?.granted === true;
      setConsent(granted ? "granted" : "denied");
    };
    window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, handleConsentChange);
    return () => {
      window.clearTimeout(consentTimer);
      window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, handleConsentChange);
    };
  }, [pixelId]);

  useEffect(() => {
    if (consent !== "granted") {
      lastSeenLocation.current = currentLocation;
      return;
    }
    if (lastSeenLocation.current === undefined || lastSeenLocation.current === currentLocation) {
      lastSeenLocation.current = currentLocation;
      return;
    }
    lastSeenLocation.current = currentLocation;
    track("page_view");
  }, [consent, currentLocation]);

  if (!pixelId || consent !== "granted") return null;

  return (
    <Script id="meta-pixel-base" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`}
    </Script>
  );
}
