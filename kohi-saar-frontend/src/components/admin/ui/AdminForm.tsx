"use client";

import type { FormEvent, ReactNode } from "react";

export function AdminForm({
  onSubmit,
  children,
  footer,
}: {
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <form
      className="admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
    >
      {children}
      {footer && <div className="admin-form__footer">{footer}</div>}
    </form>
  );
}

export function AdminFormField({
  label,
  error,
  children,
  required = false,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="admin-form-field">
      <label className="admin-form-field__label">
        {label}
        {required && <span className="admin-form-field__required">*</span>}
      </label>
      {children}
      {error && <p className="admin-form-field__error">{error}</p>}
    </div>
  );
}
