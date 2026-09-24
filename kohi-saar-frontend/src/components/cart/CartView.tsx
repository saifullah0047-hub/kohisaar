"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

function formatPrice(price: number, currency: string) {
  return currency === "PKR"
    ? `Rs. ${price.toLocaleString("en-PK")}`
    : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}

export function CartView() {
  const { lines, itemCount, subtotal, total, currency, hydrated, sessionToken, cartError, refreshCart, removeItem, increaseQuantity, decreaseQuantity, updateQuantity } = useCart();
  const unavailableItems = lines.filter((line) => !line.available);

  useEffect(() => {
    if (hydrated && sessionToken) void refreshCart();
  }, [hydrated, refreshCart, sessionToken]);

  if (!hydrated) {
    return (
      <section className="cart-view page-shell" aria-labelledby="cart-heading">
        <div className="cart-view__hero">
          <p className="eyebrow">Your selection</p>
          <h1 id="cart-heading">Your cart</h1>
          <p className="cart-view__subtitle">Selected pieces, ready for your journey.</p>
          {cartError ? <p className="checkout-error" role="alert">{cartError}</p> : null}
        </div>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="cart-view page-shell" aria-labelledby="cart-heading">
        <div className="cart-view__hero">
          <p className="eyebrow">Your selection</p>
          <h1 id="cart-heading">Your cart is empty</h1>
          <p className="cart-view__subtitle">Explore the Kohisaar collection and discover our Himalayan resin.</p>
          {cartError ? <p className="checkout-error" role="alert">{cartError}</p> : null}
        </div>
        <div className="cart-view__empty">
          <Link className="button button--dark" href="/shop">Explore collection</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-view page-shell" aria-labelledby="cart-heading">
      <div className="cart-view__hero">
        <p className="eyebrow">Your selection</p>
        <h1 id="cart-heading">Your cart</h1>
        <p className="cart-view__subtitle">Selected pieces, ready for your journey.</p>
        <p className="cart-view__count">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
        {cartError ? <p className="checkout-error" role="alert">{cartError}</p> : null}
        {unavailableItems.length > 0 ? <p className="checkout-error" role="alert">Remove unavailable items before checkout.</p> : null}
      </div>

      <div className="cart-view__layout">
        <div className="cart-lines">
          {lines.map((line) => {
            const image = line.product?.images?.[0];
            return (
              <article
                className={`cart-line${line.available ? "" : " cart-line--unavailable"}`}
                key={`${line.item.productId}-${line.item.variantId ?? "default"}`}
              >
                <div className="cart-line__image-wrap">
                  {image ? (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={180}
                      height={225}
                      className="cart-line__image"
                    />
                  ) : (
                    <div className="cart-line__image cart-line__image--empty" aria-hidden="true" />
                  )}
                </div>

                <div className="cart-line__details">
                  <div className="cart-line__info">
                    <p className="cart-line__category">{line.product?.category ?? "Unavailable"}</p>
                    <h2 className="cart-line__name">
                      {line.available && line.product ? (
                        <Link href={`/products/${line.product.slug}`}>{line.product.name}</Link>
                      ) : (
                        "Product unavailable"
                      )}
                    </h2>
                    {line.variant ? <p className="cart-line__variant">{line.variant.name}</p> : null}
                  </div>

                  <p className="cart-line__price">
                    {line.available
                      ? `${formatPrice(line.unitPrice, line.currency)}`
                      : "Remove this item"}
                  </p>

                  <div className="cart-line__controls">
                    {line.available && line.product ? (
                      <>
                        <div className="quantity-control">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${line.product.name}`}
                            disabled={line.item.quantity <= 1}
                            onClick={() => decreaseQuantity(line.item.productId, line.item.variantId)}
                          >
                            &minus;
                          </button>
                          <input
                            aria-label={`Quantity of ${line.product.name}`}
                            inputMode="numeric"
                            min="1"
                            max="99"
                            value={line.item.quantity}
                            onChange={(e) => updateQuantity(line.item.productId, Number(e.target.value), line.item.variantId)}
                          />
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${line.product.name}`}
                            onClick={() => increaseQuantity(line.item.productId, line.item.variantId)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="cart-line__remove"
                          type="button"
                          aria-label={`Remove ${line.product.name}`}
                          onClick={() => removeItem(line.item.productId, line.item.variantId)}
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        className="cart-line__remove"
                        type="button"
                        onClick={() => removeItem(line.item.productId, line.item.variantId)}
                      >
                        Remove unavailable item
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="cart-summary" aria-labelledby="summary-heading">
          <h2 id="summary-heading">Summary</h2>
          <div className="cart-summary__divider" aria-hidden="true"></div>
          <div className="cart-summary__row">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal, currency)}</strong>
          </div>
          <div className="cart-summary__divider" aria-hidden="true"></div>
          <div className="cart-summary__row cart-summary__row--total">
            <span>Total</span>
            <strong>{formatPrice(total, currency)}</strong>
          </div>
          <p className="cart-summary__note">Shipping & payment<br />calculated at checkout.</p>
          <div className="cart-summary__divider cart-summary__divider--subtle" aria-hidden="true"></div>
          {unavailableItems.length > 0 ? (
            <span className="cart-summary__checkout" aria-disabled="true">Remove unavailable items to checkout</span>
          ) : (
            <Link href="/checkout" className="cart-summary__checkout">Proceed to Checkout</Link>
          )}
        </aside>
      </div>

      <div className="cart-view__footer">
        <Link className="cart-view__continue" href="/shop">
          <span aria-hidden="true">&larr;</span> Continue Shopping
        </Link>
      </div>
    </section>
  );
}
