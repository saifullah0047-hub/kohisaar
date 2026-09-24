"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { CheckoutPayload, CheckoutSubmit, PaymentMethod } from "@/types/checkout";
import { track } from "@/lib/analytics";

/* ────────────────────────────────────────────────────────────────── */
/*  Constants                                                        */
/* ────────────────────────────────────────────────────────────────── */

const SHIPPING_FEE = 250;
const LAST_ORDER_KEY = "kohi-saar-last-demo-order";

const PAKISTAN_PROVINCES = [
  "Azad Kashmir",
  "Balochistan",
  "Gilgit-Baltistan",
  "Islamabad Capital Territory",
  "Khyber Pakhtunkhwa",
  "Punjab",
  "Sindh",
] as const;

/* ────────────────────────────────────────────────────────────────── */
/*  Types                                                            */
/* ────────────────────────────────────────────────────────────────── */

interface CheckoutFormProps {
  onSubmitCheckout?: CheckoutSubmit;
}

type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

/* ────────────────────────────────────────────────────────────────── */
/*  Helpers                                                          */
/* ────────────────────────────────────────────────────────────────── */

const initialValues: FormValues = {
  fullName: "",
  email: "",
  phone: "+92",
  address: "",
  city: "",
  region: "",
  postalCode: "",
  notes: "",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  const digits = values.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) errors.phone = "Enter a valid phone number with country code.";
  if (values.address.trim().length < 5) errors.address = "Enter your house, street, or area.";
  if (values.city.trim().length < 2) errors.city = "Enter your city.";
  if (!values.region) errors.region = "Select your province or region.";
  if (values.postalCode.trim().length < 3) errors.postalCode = "Enter your postal code.";
  return errors;
}

function formatPKR(value: number): string {
  return `Rs. ${value.toLocaleString("en-PK")}`;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Main Component                                                   */
/* ────────────────────────────────────────────────────────────────── */

export function CheckoutForm({ onSubmitCheckout }: CheckoutFormProps) {
  const { lines, subtotal, currency, hydrated, sessionToken, refreshCart, clearCart } = useCart();

  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const paymentMethod: PaymentMethod = "cash-on-delivery";
  const [submissionError, setSubmissionError] = useState<string>();
  const [orderNumber, setOrderNumber] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const purchaseTrackedRef = useRef(false);

  useEffect(() => {
    const savedOrder = window.sessionStorage.getItem(LAST_ORDER_KEY);
    if (!savedOrder) return;
    const timer = window.setTimeout(() => setOrderNumber(savedOrder), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (orderNumber) window.scrollTo({ top: 0, behavior: "instant" });
  }, [orderNumber]);

  useEffect(() => {
    if (hydrated) void refreshCart();
  }, [hydrated, refreshCart]);

  const unavailableItems = lines.filter((line) => !line.available);
  const canSubmit =
    hydrated &&
    lines.length > 0 &&
    unavailableItems.length === 0 &&
    !submitting;

  const shipping = lines.length > 0 ? SHIPPING_FEE : 0;
  const finalTotal = subtotal + shipping;

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const markTouched = (field: string) => setTouched((current) => ({ ...current, [field]: true }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmissionError(undefined);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      region: true,
      postalCode: true,
    });

    if (Object.keys(nextErrors).length > 0 || !canSubmit) return;

    track("begin_checkout", { value: finalTotal, currency });
    setSubmitting(true);

    try {
      const submit =
        onSubmitCheckout ??
        (async (payload: CheckoutPayload) => {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1"}/orders`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-cart-session": sessionToken ?? "",
              },
              body: JSON.stringify({
                customer: payload.customer,
                paymentMethod:
                  payload.paymentMethod === "cash-on-delivery"
                    ? "CASH_ON_DELIVERY"
                    : "ONLINE",
              }),
            }
          );
          if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.error?.message ?? "Order request failed");
          }
          return (await response.json() as { data: { orderNumber: string } }).data;
        });

      const result = await submit({ customer: values, paymentMethod, items: [] });

      if (!purchaseTrackedRef.current) {
        purchaseTrackedRef.current = true;
        track("purchase", {
          value: finalTotal,
          currency,
          order_id: result.orderNumber,
          items: lines
            .filter((line) => line.available && line.product)
            .map((line) => ({
              itemId: line.product?.id ?? "",
              itemName: line.product?.name ?? "",
              price: line.unitPrice,
              quantity: line.item.quantity,
              currency: line.currency,
            })),
        });
      }

       setOrderNumber(result.orderNumber);
       window.sessionStorage.setItem(LAST_ORDER_KEY, result.orderNumber);
       clearCart();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We could not submit your order. Please try again.";
      setSubmissionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Order Confirmation ── */
  if (orderNumber) return <section className="checkout-page checkout-page--confirm" aria-live="polite"><OrderConfirmation orderNumber={orderNumber} /></section>;

  /* ── Empty cart ── */
  if (!hydrated || lines.length === 0) {
    return (
      <section className="checkout-empty" aria-live="polite">
        <p className="eyebrow">Checkout</p>
        <h1>Your cart is empty.</h1>
        <p>Add an approved Kohisaar product before continuing.</p>
        <Link className="button button--dark" href="/shop">
          Return to shop
        </Link>
      </section>
    );
  }

  return (
    <main className="checkout-page">
      <div className="page-shell">
        <div className="checkout-top">
          <p className="eyebrow">Secure Checkout</p>
          <h1 className="checkout-heading">Complete your order.</h1>
        </div>

        <div className="checkout-grid">
          {/* ── LEFT: Form ── */}
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            {/* Unavailable items alert */}
            {unavailableItems.length > 0 && (
              <div className="checkout-alert" role="alert">
                One or more items in your cart are unavailable.{" "}
                <Link href="/cart">Review your cart.</Link>
              </div>
            )}

            {/* ── 1. Contact Information ── */}
            <section className="checkout-section" aria-labelledby="section-contact">
              <div className="checkout-section__header">
                <span className="checkout-section__num" aria-hidden="true">1</span>
                <h2 id="section-contact" className="checkout-section__title">
                  Contact Information
                </h2>
              </div>

              <div className="checkout-section__body">
                <div className="checkout-fields">
                  <Field
                    id="fullName"
                    label="Full Name"
                    required
                    autoComplete="name"
                    value={values.fullName}
                    error={errors.fullName}
                    touched={touched.fullName}
                    onChange={(v) => updateValue("fullName", v)}
                    onBlur={() => markTouched("fullName")}
                  />
                  <Field
                    id="email"
                    label="Email Address"
                    type="email"
                    required
                    autoComplete="email"
                    value={values.email}
                    error={errors.email}
                    touched={touched.email}
                    onChange={(v) => updateValue("email", v)}
                    onBlur={() => markTouched("email")}
                  />
                  <Field
                    id="phone"
                    label="Phone Number"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+92 3XX XXXXXXX"
                    value={values.phone}
                    error={errors.phone}
                    touched={touched.phone}
                    onChange={(v) => updateValue("phone", v)}
                    onBlur={() => markTouched("phone")}
                    wide
                  />
                </div>
              </div>
            </section>

            {/* ── 2. Delivery Address ── */}
            <section className="checkout-section" aria-labelledby="section-address">
              <div className="checkout-section__header">
                <span className="checkout-section__num" aria-hidden="true">2</span>
                <h2 id="section-address" className="checkout-section__title">
                  Delivery Address
                </h2>
              </div>

              <div className="checkout-section__body">
                <div className="checkout-fields">
                  <Field
                    id="address"
                    label="House / Street / Area"
                    required
                    autoComplete="street-address"
                    value={values.address}
                    error={errors.address}
                    touched={touched.address}
                    onChange={(v) => updateValue("address", v)}
                    onBlur={() => markTouched("address")}
                    wide
                  />
                  <Field
                    id="city"
                    label="City"
                    required
                    autoComplete="address-level2"
                    value={values.city}
                    error={errors.city}
                    touched={touched.city}
                    onChange={(v) => updateValue("city", v)}
                    onBlur={() => markTouched("city")}
                  />
                  <div className="checkout-field" data-wide>
                    <label htmlFor="region">
                      Province / Region <span className="checkout-field__required" aria-label="required">*</span>
                    </label>
                    <select
                      id="region"
                      name="region"
                      value={values.region}
                      aria-invalid={Boolean(errors.region) && Boolean(touched.region)}
                      aria-describedby={errors.region ? "region-error" : undefined}
                      onChange={(e) => {
                        updateValue("region", e.target.value);
                        markTouched("region");
                      }}
                      onBlur={() => markTouched("region")}
                    >
                      <option value="" disabled>
                        Select province
                      </option>
                      {PAKISTAN_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {errors.region && touched.region && (
                      <small id="region-error" className="checkout-field__error">
                        {errors.region}
                      </small>
                    )}
                  </div>
                  <Field
                    id="postalCode"
                    label="Postal Code"
                    autoComplete="postal-code"
                    value={values.postalCode}
                    error={errors.postalCode}
                    touched={touched.postalCode}
                    onChange={(v) => updateValue("postalCode", v)}
                    onBlur={() => markTouched("postalCode")}
                  />
                  <div className="checkout-field checkout-field--wide">
                    <label htmlFor="notes">
                      Delivery Instructions{" "}
                      <small>(optional)</small>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={values.notes}
                      onChange={(e) => updateValue("notes", e.target.value)}
                      placeholder="Gate code, landmark, preferred time..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── 3. Payment Method ── */}
            <section className="checkout-section" aria-labelledby="section-payment">
              <div className="checkout-section__header">
                <span className="checkout-section__num" aria-hidden="true">3</span>
                <h2 id="section-payment" className="checkout-section__title">
                  Payment Method
                </h2>
              </div>

              <div className="checkout-section__body">
                <div className="checkout-payment-options">
                  {/* Cash on Delivery */}
                  <label
                    className={`checkout-payment-option${
                      paymentMethod === "cash-on-delivery" ? " checkout-payment-option--active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash-on-delivery"
                      checked={paymentMethod === "cash-on-delivery"}
                      onChange={() => undefined}
                    />
                    <div className="checkout-payment-option__icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                        <path d="M6 12h.01M18 12h.01" />
                      </svg>
                    </div>
                    <div className="checkout-payment-option__text">
                      <strong>Cash on Delivery</strong>
                      <span>Pay when your order arrives at your doorstep.</span>
                    </div>
                    <span className="checkout-payment-option__check" aria-hidden="true" />
                  </label>

                   <p className="checkout-payment-demo-note">
                     Demo checkout is currently available through Cash on Delivery.
                   </p>
                </div>
              </div>
            </section>

            {/* ── Submission ── */}
            {submissionError && (
              <div className="checkout-error" role="alert">
                {submissionError}
              </div>
            )}

            <button
              className="checkout-submit-btn"
              type="submit"
              disabled={!canSubmit}
            >
              {submitting ? (
                <span className="checkout-submit-btn__loading">
                  <span className="checkout-submit-btn__spinner" aria-hidden="true" />
                  Placing order…
                </span>
              ) : (
                `Place Order — ${formatPKR(finalTotal)}`
              )}
            </button>

            <p className="checkout-secure-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Your information is secure and encrypted.
            </p>
          </form>

          {/* ── RIGHT: Order Summary ── */}
          <aside className="checkout-summary" aria-labelledby="checkout-summary-heading">
            <div className="checkout-summary__sticky">
              <div className="checkout-summary__header">
                <h2 id="checkout-summary-heading">Order Summary</h2>
                <span className="checkout-summary__count">
                  {lines.length} item{lines.length !== 1 ? "s" : ""}
                </span>
              </div>

              <ul className="checkout-summary__items">
                {lines.map((line) => (
                  <li
                    className={`checkout-summary__item${
                      line.available ? "" : " checkout-summary__item--unavailable"
                    }`}
                    key={`${line.item.productId}-${line.item.variantId ?? "default"}`}
                  >
                    <div className="checkout-summary__item-img">
                      {line.product?.images[0] ? (
                        <Image
                          src={line.product.images[0].src}
                          alt={line.product.images[0].alt ?? line.product.name}
                          width={56}
                          height={70}
                          className="checkout-summary__item-thumb"
                        />
                      ) : (
                        <div className="checkout-summary__item-placeholder" aria-hidden="true" />
                      )}
                      <span className="checkout-summary__item-qty">
                        {line.item.quantity}
                      </span>
                    </div>
                    <div className="checkout-summary__item-info">
                      <span className="checkout-summary__item-name">
                        {line.product?.name ?? "Product unavailable"}
                      </span>
                      {line.variant && (
                        <span className="checkout-summary__item-variant">
                          {line.variant.name}
                        </span>
                      )}
                    </div>
                    <span className="checkout-summary__item-price">
                      {line.available ? formatPKR(line.lineTotal) : "Unavailable"}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="checkout-summary__totals">
                <div className="checkout-summary__total-row">
                  <span>Subtotal</span>
                  <strong>{formatPKR(subtotal)}</strong>
                </div>
                <div className="checkout-summary__total-row">
                  <span>Shipping</span>
                  <strong>{formatPKR(shipping)}</strong>
                </div>
                <div className="checkout-summary__total-row checkout-summary__total-row--final">
                  <span>Total</span>
                  <strong>{formatPKR(finalTotal)}</strong>
                </div>
              </div>

              <p className="checkout-summary__note">
                Delivery in 3–5 business days across Pakistan. You will receive a confirmation email shortly after placing your order.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Field Component                                                  */
/* ────────────────────────────────────────────────────────────────── */

function Field({
  id,
  label,
  type = "text",
  required = false,
  autoComplete,
  placeholder,
  value,
  error,
  touched,
  onChange,
  onBlur,
  wide = false,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  touched?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  wide?: boolean;
}) {
  const showError = error && touched;
  return (
    <div className={`checkout-field${wide ? " checkout-field--wide" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="checkout-field__required" aria-label="required">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        aria-invalid={Boolean(showError)}
        aria-describedby={showError ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {showError && (
        <small id={`${id}-error`} className="checkout-field__error">
          {error}
        </small>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  Order Confirmation                                               */
/* ────────────────────────────────────────────────────────────────── */

function OrderConfirmation({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard API unavailable */
    }
  }, [orderNumber]);

  return (
    <section className="order-confirm" aria-live="polite">
      <div className="order-confirm__content">
        <Image
          src="/images/kohi-saar-logo.jpeg"
          alt="Kohisaar"
          width={44}
          height={44}
          className="order-confirm__logo"
          priority
        />
        <div className="order-confirm__success-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="m9 16.5 4.5 4.5L23 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="order-confirm__eyebrow">Order confirmed</p>
        <h1 className="order-confirm__heading">Thank you for choosing Kohisaar.</h1>
        <p className="order-confirm__supporting">
          Your order has been received and is being prepared with care.
        </p>

        <div className="order-confirm__number-block">
          <div className="order-confirm__number-heading">
            <span className="order-confirm__number-label">Order number</span>
            <span className="order-confirm__number-note">Keep this for your records</span>
          </div>
          <div className="order-confirm__number-row">
            <span className="order-confirm__number-value">{orderNumber}</span>
            <button
              type="button"
              className="order-confirm__copy"
              onClick={handleCopy}
              aria-label={copied ? "Order number copied" : "Copy order number"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="8" y="8" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.4" />
                <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <span className="order-confirm__copy-live" aria-live="polite">
            {copied ? "Order number copied to clipboard." : ""}
          </span>
        </div>

        <div className="order-confirm__next">
          <span className="order-confirm__next-label">What Happens Next</span>
          <ol className="order-confirm__steps">
            <li className="order-confirm__step">
              <span className="order-confirm__step-num">01</span>
              <div className="order-confirm__step-body">
                <strong>Confirmation email</strong>
                <span>Sent to your inbox shortly.</span>
              </div>
            </li>
            <li className="order-confirm__step">
              <span className="order-confirm__step-num">02</span>
              <div className="order-confirm__step-body">
                <strong>Preparation</strong>
                <span>Your order is being prepared with care.</span>
              </div>
            </li>
            <li className="order-confirm__step">
              <span className="order-confirm__step-num">03</span>
              <div className="order-confirm__step-body">
                <strong>Dispatch</strong>
                <span>Tracking details will follow.</span>
              </div>
            </li>
          </ol>
        </div>

        <div className="order-confirm__actions">
          <Link href="/account/orders" className="order-confirm__cta-primary">
            <span>View order</span><span aria-hidden="true">&rarr;</span>
          </Link>
          <Link href="/shop" className="order-confirm__cta-secondary" onClick={() => window.sessionStorage.removeItem(LAST_ORDER_KEY)}>
            Continue shopping <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="order-confirm__reassurance">
          <span className="order-confirm__reassurance-line" aria-hidden="true" />
          <p>Packed with care.<br />Delivered with intention.</p>
        </div>
      </div>
    </section>
  );
}
