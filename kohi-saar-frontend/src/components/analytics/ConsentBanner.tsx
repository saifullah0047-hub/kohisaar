"use client";

import { useEffect, useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent, type AnalyticsConsent } from "@/lib/analytics";

export function ConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const consentTimer = window.setTimeout(() => setConsent(getAnalyticsConsent()), 0);
    return () => window.clearTimeout(consentTimer);
  }, []);

  if (consent === null) return null;

  const chooseConsent = (granted: boolean) => {
    setAnalyticsConsent(granted);
    setConsent(granted ? "granted" : "denied");
    setPreferencesOpen(false);
  };

  if (consent !== undefined && !preferencesOpen) {
    return (
      <button
        className="consent-preferences-trigger"
        type="button"
        onClick={() => setPreferencesOpen(true)}
        aria-label="Change privacy preferences"
      >
        Privacy choices
      </button>
    );
  }

  return (
    <aside className="consent-banner" aria-label="Privacy preferences" aria-describedby="consent-banner-description">
      <div className="consent-banner__copy">
        <p className="consent-banner__eyebrow">Your privacy choices</p>
        <h2>Keep the ritual considered.</h2>
        <p id="consent-banner-description">
          We use optional analytics and Meta Pixel measurement to understand visits and improve the Kohisaar experience. You can change this choice at any time.
        </p>
      </div>
      <div className="consent-banner__actions">
        <button className="consent-banner__button consent-banner__button--primary" type="button" onClick={() => chooseConsent(true)}>
          Accept analytics
        </button>
        <button className="consent-banner__button" type="button" onClick={() => chooseConsent(false)}>
          Reject
        </button>
        {consent !== undefined && (
          <button className="consent-banner__button consent-banner__button--quiet" type="button" onClick={() => setPreferencesOpen(false)}>
            Close
          </button>
        )}
      </div>
    </aside>
  );
}
