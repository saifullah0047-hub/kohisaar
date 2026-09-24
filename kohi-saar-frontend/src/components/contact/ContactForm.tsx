"use client";

import { FormEvent, useState } from "react";

type FormValues = { name: string; email: string; phone: string; comment: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = { name: "", email: "", phone: "", comment: "" };

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Please enter a valid email address.";
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const updateValue = (field: keyof FormValues, value: string) => setValues((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setStatus(undefined);
    if (Object.keys(nextErrors).length > 0 || submitting) return;

    setSubmitting(true);
    const subject = encodeURIComponent("Kohisaar Shilajit enquiry");
    const body = encodeURIComponent(`Name: ${values.name}\nEmail: ${values.email}\nPhone: ${values.phone || "Not provided"}\n\n${values.comment}`);
    window.location.href = `mailto:kohisaarshilajit@gmail.com?subject=${subject}&body=${body}`;
    setStatus("Your email app should open with your message ready to send.");
    setSubmitting(false);
  };

  return (
    <form className="contact-form form-doodle-surface" onSubmit={handleSubmit} noValidate>
      <p className="eyebrow">HOW CAN WE HELP?</p>
      <span className="contact-form__divider" aria-hidden="true" />

      <div className="contact-form__fields">
        <label className="contact-field" htmlFor="contact-name">
          <span className="contact-field__label">NAME</span>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            value={values.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            onChange={(event) => updateValue("name", event.target.value)}
          />
          {errors.name ? <small id="contact-name-error" className="contact-field__error">{errors.name}</small> : null}
        </label>

        <label className="contact-field" htmlFor="contact-email">
          <span className="contact-field__label">EMAIL <small>Required</small></span>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            onChange={(event) => updateValue("email", event.target.value)}
          />
          {errors.email ? <small id="contact-email-error" className="contact-field__error">{errors.email}</small> : null}
        </label>

        <label className="contact-field" htmlFor="contact-phone">
          <span className="contact-field__label">PHONE</span>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
          />
        </label>

        <label className="contact-field" htmlFor="contact-comment">
          <span className="contact-field__label">COMMENT</span>
          <textarea
            id="contact-comment"
            name="comment"
            rows={5}
            value={values.comment}
            onChange={(event) => updateValue("comment", event.target.value)}
          />
        </label>
      </div>

      {status ? <p className="contact-form__status" role="status">{status}</p> : null}

      <button className="contact-form__submit" type="submit" disabled={submitting}>
        <span>{submitting ? "OPENING EMAIL" : "SEND MESSAGE"}</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </form>
  );
}
