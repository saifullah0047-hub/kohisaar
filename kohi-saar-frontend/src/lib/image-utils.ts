/**
 * Safely sanitizes image src strings so that Next.js <Image /> and browser <img>
 * never throw fatal runtime errors like `Failed to construct 'URL': Invalid URL`.
 */
export function sanitizeImageSrc(
  src?: string | null,
  fallback = "/images/premium.jpeg",
): string {
  if (!src || typeof src !== "string") return fallback;

  // Strip outer quotes and whitespace (handles users pasting quoted paths like "C:\...")
  let clean = src.trim().replace(/^["']+|["']+$/g, "").trim();
  if (!clean) return fallback;

  // Detect local file system paths (e.g. C:\Users\... or /Users/... or file://)
  if (
    /^[a-zA-Z]:[/\\]/i.test(clean) ||
    clean.startsWith("file:") ||
    clean.includes("\\")
  ) {
    return fallback;
  }

  // If relative path without leading slash, prepend slash
  if (
    !clean.startsWith("/") &&
    !clean.startsWith("http://") &&
    !clean.startsWith("https://")
  ) {
    clean = "/" + clean;
  }

  // Safely URL-encode spaces and special characters without double-encoding
  try {
    clean = encodeURI(decodeURI(clean));
  } catch {
    return fallback;
  }

  // Verify that WHATWG URL constructor will not reject it
  try {
    if (clean.startsWith("/")) {
      new URL(clean, "http://localhost");
    } else {
      new URL(clean);
    }
    return clean;
  } catch {
    return fallback;
  }
}

