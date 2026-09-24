"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import type { AccountApi } from "@/types/account";

interface AccountAreaProps {
  section?: "overview" | "orders" | "addresses";
  api?: AccountApi;
}

const sectionCopy = {
  overview: { title: "Your account.", label: "Personal space" },
  orders: { title: "Your orders.", label: "Order history" },
  addresses: { title: "Your addresses.", label: "Saved details" },
};

const benefits = [
  { heading: "Track your orders", body: "From dispatch to delivery." },
  { heading: "Save your addresses", body: "For faster checkout next time." },
  { heading: "Access your order history", body: "Every past order, in one place." },
  { heading: "Be the first to know", body: "New arrivals and small-batch releases." },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function AccountArea({ section = "overview", api }: AccountAreaProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string>();
  const copy = sectionCopy[section];

  const logout = async () => {
    if (!api) return;
    setLoggingOut(true);
    setError(undefined);
    try {
      await api.logout();
    } catch {
      setError("We could not sign you out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  /* ── Non-overview sections (orders / addresses) ── */
  if (section !== "overview")
    return (
      <>
        <Navbar />
        <main className="account-page">
          <section className="account-panel page-shell" aria-labelledby="account-section-heading">
            <p className="eyebrow">{copy.label}</p>
            <h1 id="account-section-heading">{copy.title}</h1>
            <div className="account-empty" role="status">
              <p>
                {section === "orders"
                  ? "Your order history will appear here after account services are connected."
                  : "Saved addresses will appear here after account services are connected."}
              </p>
              <Link className="text-link" href="/account">
                Return to account
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );

  /* ── Overview — Signed-out state ── */
  return (
    <>
      <Navbar />
      <main className="account-page">
        {/* ── Header Block ── */}
        <section className="account-header page-shell" aria-labelledby="account-heading">
          <p className="eyebrow">PERSONAL SPACE</p>
          <h1 id="account-heading">{copy.title}</h1>
          <span className="account-header__divider" aria-hidden="true" />
        </section>

        {/* ── Two-Column Layout ── */}
        <div className="account-layout page-shell">
          {/* Left Column — Sign-In Form */}
          <div className="account-layout__form">
            <SignedInForm api={api} />
          </div>

          {/* Right Column — Benefits */}
          <div className="account-layout__benefits">
            <div className="account-benefit-card">
              <p className="eyebrow">WHY AN ACCOUNT?</p>
              <span className="account-benefit-card__divider" aria-hidden="true" />
              <ul className="account-benefit-list" role="list">
                {benefits.map((b) => (
                  <li key={b.heading} className="account-benefit-item">
                    <CheckIcon className="account-benefit-item__icon" />
                    <div>
                      <strong className="account-benefit-item__heading">{b.heading}</strong>
                      <p className="account-benefit-item__body">{b.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ── Embedded Sign-In Form ── */
function SignedInForm({ api }: { api?: AccountApi }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(undefined);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (api) {
        await api.login({ email: email.trim(), password });
      } else {
        throw new Error("Account API is not connected yet.");
      }
    } catch {
      setSubmitError("We could not complete that request. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="account-signin-form form-doodle-surface" onSubmit={handleSubmit} noValidate>
      <p className="eyebrow">SIGN IN</p>
      <span className="account-signin-form__divider" aria-hidden="true" />

      <div className="account-signin-form__fields">
        <label className="account-field" htmlFor="account-email">
          <span className="account-field__label">EMAIL</span>
          <input
            id="account-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "account-email-error" : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email ? (
            <small id="account-email-error" className="account-field__error">{errors.email}</small>
          ) : null}
        </label>

        <label className="account-field" htmlFor="account-password">
          <span className="account-field__label">PASSWORD</span>
          <input
            id="account-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "account-password-error" : undefined}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password ? (
            <small id="account-password-error" className="account-field__error">{errors.password}</small>
          ) : null}
        </label>
      </div>

      {submitError ? (
        <p className="account-form__error" role="alert">{submitError}</p>
      ) : null}

      <button className="account-signin-form__submit" type="submit" disabled={submitting}>
        <span>{submitting ? "PLEASE WAIT" : "SIGN IN"}</span>
        <span aria-hidden="true">&rarr;</span>
      </button>

      <span className="account-signin-form__divider" aria-hidden="true" />

      <p className="account-signin-form__register">
        New to Kohisaar?{" "}
        <Link href="/register">Create an account &rarr;</Link>
      </p>
    </form>
  );
}
