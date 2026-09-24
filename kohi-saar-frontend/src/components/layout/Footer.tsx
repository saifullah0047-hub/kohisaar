import { Logo } from "@/components/brand/Logo";
import Link from "next/link";
import { Clock3, Mail, Phone } from "lucide-react";

const footerGroups = [
  { title: "Shop", links: [{ label: "All Products", href: "/shop" }] },
  { title: "Explore", links: [{ label: "Our Story", href: "/story" }, { label: "Journal", href: "/journal" }] },
  { title: "Support", links: [{ label: "Contact", href: "/contact" }, { label: "Account", href: "/account" }] },
];

export function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="site-footer__pattern" aria-hidden="true" />
      <div className="page-shell site-footer__inner">
        <section className="site-footer__contact" aria-labelledby="footer-contact-heading">
          <div className="site-footer__contact-intro">
            <p className="eyebrow">DIRECT CONTACT</p>
            <h2 id="footer-contact-heading">Good questions deserve considered answers.</h2>
            <p>Reach us directly or leave a note. We will help you find the right place to begin.</p>
          </div>
          <div className="site-footer__contact-items">
            <a className="site-footer__contact-item" href="tel:+923208198010">
              <Phone size={17} strokeWidth={1.4} aria-hidden="true" />
              <span className="site-footer__contact-label">PHONE</span>
              <span className="site-footer__contact-value">0320 8188010</span>
            </a>
            <a className="site-footer__contact-item" href="mailto:kohusaarshilajit@gmail.com">
              <Mail size={17} strokeWidth={1.4} aria-hidden="true" />
              <span className="site-footer__contact-label">EMAIL</span>
              <span className="site-footer__contact-value">kohusaarshilajit@gmail.com</span>
            </a>
            <div className="site-footer__contact-item">
              <Clock3 size={17} strokeWidth={1.4} aria-hidden="true" />
              <span className="site-footer__contact-label">BUSINESS HOURS</span>
              <span className="site-footer__contact-value">9:00 AM – 5:00 PM</span>
            </div>
          </div>
          <div className="site-footer__support-notes">
            <div><span>ORDER ASSISTANCE</span><p>Please include your order number when contacting us about an existing order.</p></div>
            <div><span>PRODUCT QUESTIONS</span><p>If you have questions about our shilajit, we&apos;re here to help.</p></div>
          </div>
        </section>

        <div className="site-footer__main">
          <section className="site-footer__closing" aria-labelledby="footer-closing-heading">
            <div className="site-footer__brand-lockup" aria-label="Kohisaar">
              <Logo className="site-footer__logo" />
              <span>KOHISAAR</span>
            </div>
            <h2 id="footer-closing-heading">Begin with Kohisaar.</h2>
            <p className="site-footer__closing-copy">Explore the collection, discover the story, and take your time with the ritual.</p>
            <div className="site-footer__closing-links">
              <Link className="site-footer__primary-link" href="/shop">Explore the collection <span aria-hidden="true">→</span></Link>
              <Link className="site-footer__secondary-link" href="/story">Our story <span aria-hidden="true">→</span></Link>
            </div>
          </section>
          <nav className="site-footer__links" aria-label="Footer">
            {footerGroups.map((group) => <div className="site-footer__group" key={group.title}><h3>{group.title}</h3>{group.links.map((link) => <Link key={link.href} href={link.href}>{link.label} <span aria-hidden="true">→</span></Link>)}</div>)}
          </nav>
        </div>
      </div>
      <div className="page-shell site-footer__bottom">
        <span>© {new Date().getFullYear()} Kohisaar</span>
        <span className="site-footer__legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></span>
      </div>
    </footer>
  );
}
