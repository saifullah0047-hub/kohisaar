import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";

export default function ReturnsPage() {
  return (
    <>
      <Navbar />
      <main className="policy-page page-shell" aria-labelledby="returns-heading">
        <p className="eyebrow">Kohisaar</p>
        <h1 id="returns-heading">Return &amp; Refund Policy</h1>
        <section className="policy-page__section" aria-labelledby="returns-support-heading">
          <h2 id="returns-support-heading">Need help with an order?</h2>
          <p>For help with a return or refund, contact our team and include your order number. We will review your request and advise on the next steps available for your order.</p>
          <p><Link href="/contact">Contact Kohisaar</Link></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
