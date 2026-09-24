import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { ContactForm } from "@/components/contact/ContactForm";
import { Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="contact-page">
        {/* ── Header Block ── */}
        <section className="contact-header" aria-labelledby="contact-heading">
          <div className="page-shell contact-header__inner">
            <p className="eyebrow">CONTACT</p>
            <h1 id="contact-heading">Let&apos;s talk about what you&apos;re looking for.</h1>
            <p className="contact-header__subtitle">
              Questions about our Himalayan shilajit, pack sizes, orders or
              delivery? Our team is here to help.
            </p>
            <span className="contact-header__divider" aria-hidden="true" />
          </div>
        </section>

        {/* ── Two-Column Layout ── */}
        <div className="contact-layout page-shell">
          {/* Left Column — Form */}
          <div className="contact-layout__form">
            <ContactForm />
          </div>

          {/* Right Column — Info Cards */}
          <div className="contact-layout__info">
            <div className="contact-info-intro">
              <p className="eyebrow">DIRECT CONTACT</p>
              <h2>Good questions deserve considered answers.</h2>
              <p>Reach us directly or leave a note. We will help you find the right place to begin.</p>
            </div>

            <div className="contact-card">
              <Phone className="contact-card__icon" size={18} aria-hidden="true" />
              <p className="contact-card__label">PHONE</p>
              <a className="contact-card__value" href="tel:+923208198010">
                0320 8188010
              </a>
            </div>

            <div className="contact-card">
              <Mail className="contact-card__icon" size={18} aria-hidden="true" />
              <p className="contact-card__label">EMAIL</p>
              <a className="contact-card__value" href="mailto:kohusaarshilajit@gmail.com">
                kohusaarshilajit@gmail.com
              </a>
            </div>

            <div className="contact-card">
              <Clock className="contact-card__icon" size={18} aria-hidden="true" />
              <p className="contact-card__label">BUSINESS HOURS</p>
              <p className="contact-card__value">9:00 AM – 5:00 PM</p>
            </div>

            <div className="contact-card">
              <p className="contact-card__label">ORDER ASSISTANCE</p>
              <p className="contact-card__value">
                Please include your order number when contacting us about an
                existing order.
              </p>
            </div>

            <div className="contact-card">
              <p className="contact-card__label">PRODUCT QUESTIONS</p>
              <p className="contact-card__value">
                If you have questions about our shilajit, we&apos;re here to
                help.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
