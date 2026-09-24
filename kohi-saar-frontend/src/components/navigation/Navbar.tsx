"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/components/cart/CartProvider";

const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Our Story", href: "/story" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
];

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5.5 8.5h13l-.7 11H6.2l-.7-11Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 9V6.8a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const { itemCount, hydrated } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 24);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstMenuLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;
      const menu = document.getElementById("mobile-navigation");
      const focusable = menu?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`site-header${scrolled || pathname !== "/" ? " site-header--scrolled" : ""}`}>
      <nav className="nav-shell" aria-label="Main navigation">
        <Link className="brand-mark" href="/" aria-label="Kohisaar home" onClick={closeMenu}>
          <Logo priority />
        </Link>

        <div className="nav-links">
          {links.map((link) => (
            <Link className={isActive(link.href) ? "nav-link--active" : undefined} key={link.href} href={link.href} onClick={closeMenu} aria-current={isActive(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <Link className={`account-link${isActive("/account") ? " nav-link--active" : ""}`} href="/account" onClick={closeMenu} aria-current={isActive("/account") ? "page" : undefined}>Account</Link>
          <Link className="cart-link" href="/cart" aria-label={`Cart${hydrated ? `, ${itemCount} ${itemCount === 1 ? "item" : "items"}` : ""}`}>
            <BagIcon />
            <span>Cart</span>
            <span className="cart-count" aria-live="polite">{hydrated ? itemCount : 0}</span>
          </Link>
          <button
            ref={menuButtonRef}
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="menu-toggle__lines" />
          </button>
        </div>
      </nav>
      <button className="navigation-backdrop" type="button" aria-label="Close menu" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1} />
      <div id="mobile-navigation" className="mobile-navigation" aria-hidden={!menuOpen} inert={!menuOpen ? true : undefined}>
        {links.map((link) => (
          <Link className={isActive(link.href) ? "nav-link--active" : undefined} key={link.href} href={link.href} ref={link.label === "Home" ? firstMenuLinkRef : undefined} onClick={closeMenu} tabIndex={menuOpen ? 0 : -1} aria-current={isActive(link.href) ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
        <Link className={`mobile-account-link${isActive("/account") ? " nav-link--active" : ""}`} href="/account" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1} aria-current={isActive("/account") ? "page" : undefined}>Account</Link>
        <Link className="mobile-cart-link" href="/cart" onClick={closeMenu} tabIndex={menuOpen ? 0 : -1}>Cart</Link>
      </div>
    </header>
  );
}
