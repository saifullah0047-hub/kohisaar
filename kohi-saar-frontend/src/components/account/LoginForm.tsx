"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import type { AccountApi } from "@/types/account";

interface LoginFormProps {
  api?: Pick<AccountApi, "login">;
}

interface FormValues {
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const benefits = [
  { num: "01", heading: "Track your orders", body: "From dispatch to delivery." },
  { num: "02", heading: "Save your addresses", body: "For faster checkout next time." },
  { num: "03", heading: "Access your order history", body: "Every past order, in one place." },
  { num: "04", heading: "Be the first to know", body: "New arrivals and small-batch releases." },
];

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

export function LoginForm({ api }: LoginFormProps) {
  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof FormValues, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError(undefined);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (api) {
        await api.login({
          email: values.email.trim(),
          password: values.password,
        });
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
    <>
      <Navbar />
      <main className="register-page">
        {/* ── Deep Header Block ── */}
        <section className="register-header" aria-labelledby="login-heading">
          <p className="eyebrow register-header__eyebrow">P E R S O N A L &nbsp; S P A C E</p>
          <h1 id="login-heading">Welcome back.</h1>
          <p className="register-header__subtitle">
            Sign in to view your account, orders, and saved addresses.
          </p>
          <span className="register-header__divider" aria-hidden="true" />
        </section>

        {/* ── Two-Column Layout ── */}
        <div className="register-layout page-shell">
          {/* Left Column — Form Card */}
          <div className="register-card form-doodle-surface">
            <p className="eyebrow">SIGN IN</p>
            <span className="register-card__divider" aria-hidden="true" />

            <form className="register-form" onSubmit={handleSubmit} noValidate>
              <div className="register-form__fields">
                <label className="register-field" htmlFor="login-email">
                  <span className="register-field__label">EMAIL</span>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "login-email-error" : undefined}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  {errors.email ? (
                    <small id="login-email-error" className="register-field__error">{errors.email}</small>
                  ) : null}
                </label>

                <label className="register-field" htmlFor="login-password">
                  <span className="register-field__label">PASSWORD</span>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={values.password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "login-password-error" : undefined}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  {errors.password ? (
                    <small id="login-password-error" className="register-field__error">{errors.password}</small>
                  ) : null}
                </label>
              </div>

              <Link href="/forgot-password" className="register-form__forgot-link">
                Forgot password? &rarr;
              </Link>

              {submitError ? (
                <p className="register-form__error" role="alert">{submitError}</p>
              ) : null}

              <button className="register-form__submit" type="submit" disabled={submitting}>
                <span>{submitting ? "PLEASE WAIT" : "SIGN IN"}</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </form>

            <span className="register-card__divider" aria-hidden="true" />

            <p className="register-form__signin">
              New to Kohisaar?{" "}
              <Link href="/register">Create an account &rarr;</Link>
            </p>
          </div>

          {/* Right Column — Benefit Card */}
          <div className="register-card">
            <p className="eyebrow">WHY AN ACCOUNT?</p>
            <span className="register-card__divider" aria-hidden="true" />

            <div className="register-benefits">
              {benefits.map((b) => (
                <div key={b.num} className="register-benefit">
                  <span className="register-benefit__num" aria-hidden="true">{b.num}</span>
                  <span className="register-benefit__line" aria-hidden="true" />
                  <strong className="register-benefit__heading">{b.heading}</strong>
                  <p className="register-benefit__body">{b.body}</p>
                </div>
              ))}
            </div>

            <span className="register-card__divider" aria-hidden="true" />

            <div className="register-closing">
              <p className="eyebrow">JOIN THE RITUAL</p>
              <p className="register-closing__copy">
                A quiet space for people who take their daily rituals seriously.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
