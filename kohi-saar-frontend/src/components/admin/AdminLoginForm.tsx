"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(undefined); setLoading(true); try { const response = await fetch(`${API_BASE_URL}/auth/admin/login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); if (!response.ok) throw new Error("Sign in failed"); router.push("/admin"); } catch { setError("Admin sign in could not be completed."); } finally { setLoading(false); } };
  return <main className="admin-login"><section className="admin-login__panel"><p className="eyebrow">Kohisaar Admin</p><h1>Sign in securely.</h1><form onSubmit={submit} noValidate><label className="admin-field" htmlFor="admin-email">Email<input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="admin-field" htmlFor="admin-password">Password<input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error ? <p className="admin-error" role="alert">{error}</p> : null}<button className="button button--dark" type="submit" disabled={loading}>{loading ? "Verifying" : "Sign in"}</button></form><Link href="/">Return to storefront</Link></section></main>;
}
