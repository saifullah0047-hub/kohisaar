"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registerMetaPixel, track } from "@/lib/analytics";

let lastTrackedPath: string | undefined;

export function AnalyticsTracker() {
  const pathname = usePathname();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (pixelId) registerMetaPixel(pixelId);
  useEffect(() => {
    if (lastTrackedPath === pathname) return;
    lastTrackedPath = pathname;
    track("page_view");
  }, [pathname]);
  return null;
}
