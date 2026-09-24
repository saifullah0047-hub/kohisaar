"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useDrawer } from "@/components/cart/DrawerProvider";

function formatPrice(price: number, currency: string) {
  return currency === "PKR" ? `Rs. ${price.toLocaleString("en-PK")}` : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

export function MiniCartDrawer() {
  const { lines, subtotal, currency, cartError, increaseQuantity, decreaseQuantity, removeItem, hydrated } = useCart();
  const unavailableItems = lines.filter((line) => !line.available);
  const { drawerOpen, closeDrawer, addedProductName } = useDrawer();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (drawerOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
      previouslyFocusedRef.current = null;
    }
  }, [drawerOpen]);

  if (!hydrated) return null;

  return (
    <>
      <div className={`mini-cart-overlay${drawerOpen ? " mini-cart-overlay--open" : ""}`} aria-hidden="true" onClick={closeDrawer} />
      <div
        ref={drawerRef}
        className={`mini-cart-drawer${drawerOpen ? " mini-cart-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
      >
        <div className="mini-cart-drawer__header">
          <h2 className="mini-cart-drawer__title">Your Cart</h2>
          <button ref={closeButtonRef} className="mini-cart-drawer__close" type="button" aria-label="Close cart" onClick={closeDrawer}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        {addedProductName && !cartError ? (
          <div className="mini-cart-drawer__success" role="status">
            <span className="mini-cart-drawer__success-icon" aria-hidden="true">&#10003;</span>
            <span>Added to cart</span>
          </div>
        ) : null}

        <div className="mini-cart-drawer__items">
          {lines.length === 0 ? (
            <p className="mini-cart-drawer__empty">Your cart is empty.</p>
          ) : (
            lines.map((line) => {
              const image = line.product?.images?.[0];
              return (
                <div key={`${line.item.productId}-${line.item.variantId}`} className="mini-cart-line">
                  <div className="mini-cart-line__image">
                    {image ? (
                      <Image src={image.src} alt={image.alt} width={88} height={110} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      <div className="mini-cart-line__image--empty" />
                    )}
                  </div>
                  <div className="mini-cart-line__details">
                    <div className="mini-cart-line__top">
                      <p className="mini-cart-line__name">{line.product?.name ?? "Product"}</p>
                      {line.variant ? <p className="mini-cart-line__variant">{line.variant.name}</p> : null}
                      <p className="mini-cart-line__price">{formatPrice(line.unitPrice, line.currency)}</p>
                    </div>
                    <div className="mini-cart-line__bottom">
                      <div className="mini-cart-line__qty">
                        <button type="button" aria-label="Decrease quantity" disabled={line.item.quantity <= 1} onClick={() => decreaseQuantity(line.item.productId, line.item.variantId)}>-</button>
                        <span aria-live="polite">{line.item.quantity}</span>
                        <button type="button" aria-label="Increase quantity" onClick={() => increaseQuantity(line.item.productId, line.item.variantId)}>+</button>
                      </div>
                      <button className="mini-cart-line__remove" type="button" aria-label={`Remove ${line.product?.name ?? "item"}`} onClick={() => removeItem(line.item.productId, line.item.variantId)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {lines.length > 0 ? (
          <div className="mini-cart-drawer__footer">
            <div className="mini-cart-drawer__subtotal">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal, currency)}</strong>
            </div>
            <p className="mini-cart-drawer__shipping-note">Shipping &amp; taxes calculated at checkout</p>
            {cartError ? <p className="checkout-error" role="alert">{cartError}</p> : null}
            <Link className="mini-cart-drawer__btn mini-cart-drawer__btn--primary" href="/cart" onClick={closeDrawer}>View Cart</Link>
            {unavailableItems.length > 0 ? <span className="mini-cart-drawer__btn mini-cart-drawer__btn--secondary" aria-disabled="true">Remove unavailable items to checkout</span> : <Link className="mini-cart-drawer__btn mini-cart-drawer__btn--secondary" href="/checkout" onClick={closeDrawer}>Checkout</Link>}
            <button className="mini-cart-drawer__continue" type="button" onClick={closeDrawer}>Continue Shopping</button>
          </div>
        ) : (
          <div className="mini-cart-drawer__footer">
            <button className="mini-cart-drawer__continue" type="button" onClick={closeDrawer}>Continue Shopping</button>
          </div>
        )}
      </div>
    </>
  );
}
