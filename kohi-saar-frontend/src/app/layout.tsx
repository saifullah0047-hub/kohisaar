import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kohisaar | Himalayan Shilajit",
    template: "%s | Kohisaar",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, title: "Kohisaar | Himalayan Wellness", description: DEFAULT_DESCRIPTION, url: SITE_URL, images: [{ url: "/images/koh-hero-poster.jpg", width: 1600, height: 900, alt: "Kohisaar Himalayan landscape" }] },
  twitter: { card: "summary_large_image", title: "Kohisaar | Himalayan Wellness", description: DEFAULT_DESCRIPTION, images: ["/images/koh-hero-poster.jpg"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
