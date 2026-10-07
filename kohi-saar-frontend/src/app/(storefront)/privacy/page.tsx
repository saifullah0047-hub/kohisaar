import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="privacy-page page-shell">
        <p className="eyebrow">Kohisaar</p>
        <h1>Privacy choices.</h1>
        <section className="privacy-page__section" aria-labelledby="analytics-privacy-heading">
          <h2 id="analytics-privacy-heading">Analytics and marketing</h2>
          <p>
            Kohisaar may use optional analytics and Meta Pixel measurement to understand how the storefront is used and to improve the experience. These tools are not enabled until you choose to accept analytics.
          </p>
          <p>
            You can reject analytics when the privacy banner appears, or reopen your choice later using the <strong>Privacy choices</strong> control. Your preference is stored on this device.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
