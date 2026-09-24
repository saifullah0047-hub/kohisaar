"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import type { AccountApi } from "@/types/account";

interface RegisterFormProps {
  api?: Pick<AccountApi, "register">;
}

interface FormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  if (values.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  if (values.password !== values.confirmPassword) errors.confirmPassword = "Passwords must match.";
  return errors;
}

export function RegisterForm({ api }: RegisterFormProps) {
  const [values, setValues] = useState<FormValues>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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
        await api.register({
          fullName: values.fullName.trim(),
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
        <section className="register-header" aria-labelledby="register-heading">
          <p className="eyebrow register-header__eyebrow">P E R S O N A L &nbsp; S P A C E</p>
          <h1 id="register-heading">Create your account.</h1>
          <p className="register-header__subtitle">
            Save your details, keep track of your orders, and make your next
            visit effortless.
          </p>
          <span className="register-header__divider" aria-hidden="true" />
        </section>

        {/* ── Two-Column Layout ── */}
        <div className="register-layout page-shell">
          {/* Left Column — Form Card */}
          <div className="register-card form-doodle-surface">
            <p className="eyebrow">YOUR DETAILS</p>
            <span className="register-card__divider" aria-hidden="true" />

            <form className="register-form" onSubmit={handleSubmit} noValidate>
              <div className="register-form__fields">
                <label className="register-field" htmlFor="reg-fullName">
                  <span className="register-field__label">FULL NAME</span>
                  <input
                    id="reg-fullName"
                    name="fullName"
                    autoComplete="name"
                    value={values.fullName}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "reg-fullName-error" : undefined}
                    onChange={(e) => update("fullName", e.target.value)}
                  />
                  {errors.fullName ? (
                    <small id="reg-fullName-error" className="register-field__error">{errors.fullName}</small>
                  ) : null}
                </label>

                <label className="register-field" htmlFor="reg-email">
                  <span className="register-field__label">EMAIL</span>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "reg-email-error" : undefined}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  {errors.email ? (
                    <small id="reg-email-error" className="register-field__error">{errors.email}</small>
                  ) : null}
                </label>

                <label className="register-field" htmlFor="reg-password">
                  <span className="register-field__label">PASSWORD</span>
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={values.password}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "reg-password-error" : "reg-password-helper"}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  {errors.password ? (
                    <small id="reg-password-error" className="register-field__error">{errors.password}</small>
                  ) : (
                    <small id="reg-password-helper" className="register-field__helper">At least 8 characters.</small>
                  )}
                </label>

                <label className="register-field" htmlFor="reg-confirmPassword">
                  <span className="register-field__label">CONFIRM PASSWORD</span>
                  <input
                    id="reg-confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "reg-confirmPassword-error" : undefined}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                  />
                  {errors.confirmPassword ? (
                    <small id="reg-confirmPassword-error" className="register-field__error">{errors.confirmPassword}</small>
                  ) : null}
                </label>
              </div>

              {submitError ? (
                <p className="register-form__error" role="alert">{submitError}</p>
              ) : null}

              <button className="register-form__submit" type="submit" disabled={submitting}>
                <span>{submitting ? "PLEASE WAIT" : "CREATE ACCOUNT"}</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </form>

            <span className="register-card__divider" aria-hidden="true" />

            <p className="register-form__signin">
              Already have an account?{" "}
              <Link href="/login">Sign in &rarr;</Link>
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
