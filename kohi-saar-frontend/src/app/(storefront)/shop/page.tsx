import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { ShopCatalog } from "@/components/products/ShopCatalog";
import Link from "next/link";

export default function ShopPage() {
  return (
    <>
      <Navbar />
      <main className="shop-page">
        <section className="shop-hero" aria-labelledby="shop-heading">
          <div className="shop-hero__media" aria-hidden="true" />
          <div className="shop-hero__veil" aria-hidden="true" />
          <div className="shop-hero__content page-shell">
            <p className="eyebrow">THE COLLECTION</p>
            <h1 id="shop-heading">Objects of origin.</h1>
            <p className="shop-hero__description">
              A considered selection from the Kohisaar collection.
            </p>
            <Link href="#collection" className="shop-hero__cta">
              EXPLORE THE COLLECTION <span aria-hidden="true">&darr;</span>
            </Link>
          </div>
        </section>

        <section id="collection" className="shop-collection" aria-label="Product collection">
          <div className="page-shell">
            <ShopCatalog />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
