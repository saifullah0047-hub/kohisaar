import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";

export default function ShippingPage() {
  return (
    <>
      <Navbar />
      <main className="policy-page page-shell" aria-labelledby="shipping-heading">
        <p className="eyebrow">Kohisaar</p>
        <h1 id="shipping-heading">Shipping &amp; Delivery</h1>
        <section className="policy-page__section" aria-labelledby="shipping-timing-heading">
          <h2 id="shipping-timing-heading">Delivery timing</h2>
          <p>Orders are delivered in 3–5 business days across Pakistan.</p>
        </section>
        <section className="policy-page__section" aria-labelledby="shipping-charges-heading">
          <h2 id="shipping-charges-heading">Shipping charges</h2>
          <p>The shipping charge for your order is shown in the checkout summary before you place it.</p>
          <p>If you have a question about delivery to your area, <Link href="/contact">contact our team</Link>.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
