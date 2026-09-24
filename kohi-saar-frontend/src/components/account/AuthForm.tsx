"use client";

import Link from "next/link";
import { useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import type { AccountApi } from "@/types/account";

type AuthMode = "login" | "register" | "forgot-password";
interface AuthFormProps { mode: AuthMode; api?: Pick<AccountApi, "login" | "register" | "requestPasswordReset">; }
interface AuthValues { fullName: string; email: string; password: string; confirmPassword: string; }
type AuthErrors = Partial<Record<keyof AuthValues, string>>;

const modeContent: Record<AuthMode, { eyebrow: string; title: string; submit: string; supporting?: string }> = {
  login: { eyebrow: "Welcome back", title: "Enter your account.", submit: "Sign in" },
  register: { eyebrow: "JOIN KOHISAAR", title: "Create your account.", submit: "Create account \u2192", supporting: "Save your details, keep track of your orders, and make your next visit effortless." },
  "forgot-password": { eyebrow: "Account access", title: "Reset your password.", submit: "Send reset link", supporting: "Enter the email address connected to your account and we will send you a secure link to continue." },
};

const registerPlaceholders = { fullName: "Your full name", email: "you@example.com", password: "Create a password", confirmPassword: "Re-enter your password" } as const;

function validate(mode: AuthMode, values: AuthValues): AuthErrors {
  const errors: AuthErrors = {};
  if (mode === "register" && values.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (mode !== "forgot-password" && values.password.length < 8) errors.password = "Use at least 8 characters.";
  if (mode === "register" && values.password !== values.confirmPassword) errors.confirmPassword = "Passwords must match.";
  return errors;
}

export function AuthForm({ mode, api }: AuthFormProps) {
  const [values, setValues] = useState<AuthValues>({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<AuthErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const content = modeContent[mode];
  const update = (field: keyof AuthValues, value: string) => setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(mode, values);
    setErrors(nextErrors);
    setSubmitError(undefined);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      if (mode === "login" && api) await api.login({ email: values.email, password: values.password });
      else if (mode === "register" && api) await api.register({ fullName: values.fullName, email: values.email, password: values.password });
      else if (mode === "forgot-password" && api) await api.requestPasswordReset({ email: values.email });
      else throw new Error("Account API is not connected yet.");
    } catch {
      setSubmitError("We could not complete that request. Please try again later.");
    } finally { setSubmitting(false); }
  };

  return <><Navbar /><main className="account-page"><section className="auth-panel" aria-labelledby="auth-heading"><p className="eyebrow">{content.eyebrow}</p><h1 id="auth-heading">{content.title}</h1>{content.supporting ? <p className="auth-panel__supporting">{content.supporting}</p> : null}<form className="auth-form" onSubmit={handleSubmit} noValidate>{mode === "register" ? <AuthField id="fullName" label="Full name" placeholder={registerPlaceholders.fullName} value={values.fullName} error={errors.fullName} onChange={(value) => update("fullName", value)} autoComplete="name" /> : null}<AuthField id="email" label="Email" type="email" placeholder={mode === "register" ? registerPlaceholders.email : undefined} value={values.email} error={errors.email} onChange={(value) => update("email", value)} autoComplete="email" />{mode !== "forgot-password" ? <><AuthField id="password" label="Password" type="password" placeholder={mode === "register" ? registerPlaceholders.password : undefined} helper={mode === "register" ? "Use at least 8 characters." : undefined} value={values.password} error={errors.password} onChange={(value) => update("password", value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />{mode === "register" ? <AuthField id="confirmPassword" label="Confirm password" type="password" placeholder={registerPlaceholders.confirmPassword} value={values.confirmPassword} error={errors.confirmPassword} onChange={(value) => update("confirmPassword", value)} autoComplete="new-password" /> : null}</> : null}{submitError ? <p className="account-error" role="alert">{submitError}</p> : null}<button className="button button--dark auth-submit" type="submit" disabled={submitting}>{submitting ? "Please wait" : content.submit}</button></form><div className="auth-links">{mode === "login" ? <><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/register">Create an account</Link></span></> : null}{mode === "register" ? <span>Already have an account? <Link href="/login">Sign in \u2192</Link></span> : null}{mode === "forgot-password" ? <span>Remembered your password? <Link href="/login">Return to sign in</Link></span> : null}</div></section></main><Footer /></>;
}

function AuthField({ id, label, type = "text", autoComplete, placeholder, helper, value, error, onChange }: { id: keyof AuthValues; label: string; type?: string; autoComplete?: string; placeholder?: string; helper?: string; value: string; error?: string; onChange: (value: string) => void }) {
  return <label className="auth-field" htmlFor={id}><span>{label}</span><input id={id} name={id} type={type} autoComplete={autoComplete} placeholder={placeholder} value={value} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : helper && !error ? `${id}-helper` : undefined} onChange={(event) => onChange(event.target.value)} />{error ? <small id={`${id}-error`} className="auth-field__error">{error}</small> : helper ? <small id={`${id}-helper`} className="auth-field__helper">{helper}</small> : null}</label>;
}
