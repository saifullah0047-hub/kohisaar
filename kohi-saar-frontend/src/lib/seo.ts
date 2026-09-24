export const SITE_URL = "https://kohisaar.com";
export const SITE_NAME = "Kohisaar";
export const DEFAULT_DESCRIPTION = "Premium Himalayan wellness, thoughtfully prepared by Kohisaar.";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export function absoluteUrl(path: string) { return new URL(path, SITE_URL).toString(); }
