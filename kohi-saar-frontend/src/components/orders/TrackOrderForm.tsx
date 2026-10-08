"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Package } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
const ORDER_NUMBER_PATTERN = /^KS-[0-9A-F]{20}$/i;
const ORDER_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] as const;

interface TrackedOrder {
  orderNumber: string;
  status: string;
  createdAt: string;
}

interface LookupError {
  kind: "invalid" | "not-found" | "service";
  message: string;
}

function readableStatus(status: string) {
  return status.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { dateStyle: "long" });
}

function OrderProgress({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return (
      <div className={`track-order-terminal track-order-terminal--${status.toLowerCase()}`} role="status">
        <span className="track-order-terminal__marker" aria-hidden="true" />
        <div>
          <span className="track-order-terminal__label">Current order status</span>
          <strong>{readableStatus(status)}</strong>
        </div>
      </div>
    );
  }

  const finalStep = status === "FULFILLED" ? "FULFILLED" : "DELIVERED";
  const steps = [...ORDER_STEPS, finalStep] as const;
  const currentIndex = steps.indexOf(status as (typeof steps)[number]);
  const progressIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <ol className="track-order-steps" aria-label="Order status progress">
      {steps.map((step, index) => {
        const state = index < progressIndex ? "complete" : index === progressIndex ? "current" : "upcoming";
        return (
          <li className={`track-order-step track-order-step--${state}`} key={step} aria-current={state === "current" ? "step" : undefined}>
            <span className="track-order-step__marker" aria-hidden="true">{state === "complete" ? "✓" : String(index + 1).padStart(2, "0")}</span>
            <span className="track-order-step__label">{readableStatus(step)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function TrackOrderForm() {
  const searchParams = useSearchParams();
  const requestedOrderNumber = searchParams.get("orderNumber") ?? "";
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<LookupError | null>(null);
  const [loading, setLoading] = useState(false);
  const requestInFlight = useRef(false);
  const lastAutoLookup = useRef("");

  const lookupOrder = useCallback(async (input: string) => {
    if (requestInFlight.current) return;
    const normalizedOrderNumber = input.trim().toUpperCase();
    setOrderNumber(normalizedOrderNumber);
    setOrder(null);
    setError(null);

    if (!normalizedOrderNumber) {
      setError({ kind: "invalid", message: "Enter your Order ID to check its status." });
      return;
    }
    if (!ORDER_NUMBER_PATTERN.test(normalizedOrderNumber)) {
      setError({ kind: "invalid", message: "Enter the Order ID exactly as shown in your order confirmation." });
      return;
    }

    requestInFlight.current = true;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(normalizedOrderNumber)}`, { cache: "no-store" });
      if (response.status === 404) {
        setError({ kind: "not-found", message: "We couldn’t find an order with that ID. Check the number and try again." });
        return;
      }
      if (response.status === 400) {
        setError({ kind: "invalid", message: "Enter a valid Kohisaar Order ID." });
        return;
      }
      if (!response.ok) {
        setError({ kind: "service", message: "Order tracking is temporarily unavailable. Please try again." });
        return;
      }

      const body = await response.json() as { data?: Partial<TrackedOrder> };
      const result = body.data;
      if (!result || typeof result.orderNumber !== "string" || typeof result.status !== "string" || typeof result.createdAt !== "string") {
        setError({ kind: "service", message: "We couldn’t read the order status. Please try again." });
        return;
      }
      setOrder({ orderNumber: result.orderNumber, status: result.status, createdAt: result.createdAt });
    } catch {
      setError({ kind: "service", message: "We couldn’t connect to order tracking. Please try again." });
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requested = requestedOrderNumber.trim().toUpperCase();
    if (!requested || lastAutoLookup.current === requested) return;
    lastAutoLookup.current = requested;
    void lookupOrder(requested);
  }, [lookupOrder, requestedOrderNumber]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void lookupOrder(orderNumber);
  };

  return (
    <section className="track-order-content page-shell" aria-labelledby="track-order-heading">
      <header className="track-order-heading">
        <span className="track-order-heading__icon" aria-hidden="true"><Package size={26} strokeWidth={1.3} /></span>
        <p className="eyebrow">ORDER CARE</p>
        <h1 id="track-order-heading">Track Your Order</h1>
        <p>Enter your Order ID to check your order status.</p>
      </header>

      <div className="track-order-panel" aria-busy={loading}>
        <form className="track-order-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="track-order-number">Enter Order ID</label>
          <input
            id="track-order-number"
            name="orderNumber"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={23}
            placeholder="Enter Order ID"
            value={orderNumber}
            disabled={loading}
            aria-invalid={error?.kind === "invalid"}
            aria-describedby={error ? "track-order-message" : "track-order-hint"}
            onChange={(event) => {
              setOrderNumber(event.target.value);
              setOrder(null);
              setError(null);
            }}
          />
          <p className="track-order-form__hint" id="track-order-hint">Your Order ID is shown on your order confirmation.</p>
          <button type="submit" className="track-order-submit" disabled={loading}>
            <span>{loading ? "Checking order…" : "Track Order"}</span>
            {!loading ? <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" /> : <span className="track-order-submit__spinner" aria-hidden="true" />}
          </button>
        </form>

        {loading ? <p className="track-order-loading-message" role="status">Checking your order status…</p> : null}
        {error ? <p className={`track-order-message track-order-message--${error.kind}`} id="track-order-message" role="alert">{error.message}</p> : null}

        {order ? (
          <section className="track-order-result" aria-live="polite" aria-labelledby="track-order-result-heading">
            <div className="track-order-result__header">
              <div>
                <p className="eyebrow">ORDER {order.orderNumber}</p>
                <h2 id="track-order-result-heading">Your order status</h2>
              </div>
              <span className={`track-order-status track-order-status--${order.status.toLowerCase()}`}>{readableStatus(order.status)}</span>
            </div>
            <dl className="track-order-details">
              <div>
                <dt>Order ID</dt>
                <dd>{order.orderNumber}</dd>
              </div>
              <div>
                <dt>Order date</dt>
                <dd><time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time></dd>
              </div>
            </dl>
            <div className="track-order-progress">
              <h3>Status progress</h3>
              <OrderProgress status={order.status} />
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
