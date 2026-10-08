import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { TrackOrderForm } from "@/components/orders/TrackOrderForm";

export default function TrackOrderPage() {
  return (
    <>
      <Navbar />
      <main className="track-order-page">
        <Suspense fallback={<div className="track-order-content page-shell track-order-loading" aria-busy="true"><p role="status">Preparing order lookup…</p></div>}>
          <TrackOrderForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
