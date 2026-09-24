"use client";

import { Logo } from "@/components/brand/Logo";

export function BrandedLoadingScreen({ message = "Loading Kohisaar" }: { message?: string }) {
  return (
    <div className="brand-loading" role="status" aria-live="polite" aria-label="Loading Kohisaar">
      <div className="brand-loading__inner">
        <Logo className="brand-loading__logo" priority />
        <span className="sr-only">{message}</span>
        <span className="brand-loading__line" aria-hidden="true"><span /></span>
      </div>
    </div>
  );
}
