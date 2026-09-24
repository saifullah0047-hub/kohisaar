"use client";

import { BrandedLoadingScreen } from "@/components/loading/BrandedLoadingScreen";

export function LoadingState({ message = "Loading records." }: { message?: string }) {
  return <BrandedLoadingScreen message={message} />;
}
