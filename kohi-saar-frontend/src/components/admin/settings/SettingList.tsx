"use client";

import { useEffect, useState, type ReactNode } from "react";
import { adminApi } from "@/lib/admin-api";
import { ErrorState, LoadingState } from "@/components/admin/ui";

type SettingsDraft = {
  general: { storeName: string; currency: string; status: string };
  contact: { email: string; phone: string; businessHours: string; country: string };
  shipping: { shippingFee: string; freeShippingThreshold: string; estimatedDelivery: string; shippingAvailability: string };
  seo: { siteTitle: string; metaDescription: string; socialImage: string };
  social: { instagram: string; facebook: string; whatsapp: string };
  notifications: { newOrders: boolean; lowStock: boolean; newReviews: boolean };
};

type GroupKey = keyof SettingsDraft;
type Feedback = { type: "success" | "error"; message: string };

interface SiteSetting {
  key: string;
  value: Record<string, unknown>;
}

const DEFAULT_DRAFTS: SettingsDraft = {
  general: { storeName: "Kohisaar", currency: "PKR", status: "active" },
  contact: {
    email: "kohusaarshilajit@gmail.com",
    phone: "0320 8188010",
    businessHours: "9:00 AM – 5:00 PM",
    country: "Pakistan",
  },
  shipping: { shippingFee: "", freeShippingThreshold: "5000", estimatedDelivery: "2-5 working days", shippingAvailability: "" },
  seo: { siteTitle: "Kohisaar | Himalayan Shilajit", metaDescription: "Premium Himalayan wellness, thoughtfully prepared by Kohisaar.", socialImage: "" },
  social: { instagram: "", facebook: "", whatsapp: "" },
  notifications: { newOrders: false, lowStock: false, newReviews: false },
};

function cloneDefaults(): SettingsDraft {
  return structuredClone(DEFAULT_DRAFTS);
}

function valueFrom(setting: SiteSetting | undefined, keys: string[], fallback: string) {
  if (!setting) return fallback;
  for (const key of keys) {
    const value = setting.value[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return fallback;
}

function booleanFrom(setting: SiteSetting | undefined, keys: string[], fallback: boolean) {
  if (!setting) return fallback;
  for (const key of keys) {
    if (typeof setting.value[key] === "boolean") return setting.value[key] as boolean;
  }
  return fallback;
}

function hydrateDrafts(settings: SiteSetting[]): SettingsDraft {
  const next = cloneDefaults();
  const byKey = new Map(settings.map((setting) => [setting.key, setting]));
  const general = byKey.get("store.general");
  const contact = byKey.get("store.contact");
  const shipping = byKey.get("store.shipping");
  const seoTitle = byKey.get("seo.title");
  const seoDescription = byKey.get("seo.description");
  const seoSocialImage = byKey.get("seo.socialImage");
  const social = byKey.get("social");
  const notifications = byKey.get("notifications");

  next.general = {
    storeName: valueFrom(general, ["storeName", "name"], next.general.storeName),
    currency: valueFrom(general, ["currency"], next.general.currency),
    status: valueFrom(general, ["status"], next.general.status),
  };
  next.contact = {
    email: valueFrom(contact, ["email"], next.contact.email),
    phone: valueFrom(contact, ["phone", "whatsapp"], next.contact.phone),
    businessHours: valueFrom(contact, ["businessHours", "hours"], next.contact.businessHours),
    country: valueFrom(contact, ["country"], next.contact.country),
  };
  next.shipping = {
    shippingFee: valueFrom(shipping, ["shippingFee", "fee"], next.shipping.shippingFee),
    freeShippingThreshold: valueFrom(shipping, ["freeShippingThreshold"], next.shipping.freeShippingThreshold),
    estimatedDelivery: valueFrom(shipping, ["estimatedDelivery", "estimatedDays"], next.shipping.estimatedDelivery),
    shippingAvailability: valueFrom(shipping, ["shippingAvailability", "availability", "country"], next.shipping.shippingAvailability),
  };
  next.seo = {
    siteTitle: valueFrom(seoTitle, ["title", "value"], next.seo.siteTitle),
    metaDescription: valueFrom(seoDescription, ["description", "value"], next.seo.metaDescription),
    socialImage: valueFrom(seoSocialImage, ["socialImage", "image", "value"], next.seo.socialImage),
  };
  next.social = {
    instagram: valueFrom(social, ["instagram"], next.social.instagram),
    facebook: valueFrom(social, ["facebook"], next.social.facebook),
    whatsapp: valueFrom(social, ["whatsapp"], next.social.whatsapp),
  };
  next.notifications = {
    newOrders: booleanFrom(notifications, ["newOrders", "newOrderNotifications"], next.notifications.newOrders),
    lowStock: booleanFrom(notifications, ["lowStock", "lowStockNotifications"], next.notifications.lowStock),
    newReviews: booleanFrom(notifications, ["newReviews", "newReviewNotifications"], next.notifications.newReviews),
  };
  return next;
}

function TextField({ label, value, onChange, type = "text", placeholder, help }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; help?: string }) {
  return <label className="admin-settings__field"><span className="admin-settings__label">{label}</span><input className="admin-settings__input" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />{help ? <span className="admin-settings__help">{help}</span> : null}</label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="admin-settings__field"><span className="admin-settings__label">{label}</span><select className="admin-settings__input" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function ToggleField({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="admin-settings__toggle"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="admin-settings__toggle-track" aria-hidden="true"><span /></span></label>;
}

function SettingsCard({ sectionKey, title, description, feedback, saving, onSave, onCancel, children }: { sectionKey: string; title: string; description: string; feedback?: Feedback; saving: boolean; onSave: () => void; onCancel: () => void; children: ReactNode }) {
  return <section className="adm-card admin-settings__card"><div className="admin-settings__card-head"><div><span className="adm-eyebrow">{sectionKey}</span><h2 className="admin-settings__title">{title}</h2><p className="admin-settings__description">{description}</p></div></div><div className="admin-settings__fields">{children}</div><div className="admin-settings__card-foot"><div aria-live="polite">{feedback ? <span className={`admin-settings__feedback admin-settings__feedback--${feedback.type}`}>{feedback.message}</span> : null}</div><div className="admin-settings__actions"><button type="button" className="admin-dialog__cancel" onClick={onCancel} disabled={saving}>Cancel</button><button type="button" className="admin-dialog__confirm" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button></div></div></section>;
}

export function SettingList() {
  const [drafts, setDrafts] = useState<SettingsDraft>(cloneDefaults);
  const [saved, setSaved] = useState<SettingsDraft>(cloneDefaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<GroupKey | null>(null);
  const [feedback, setFeedback] = useState<Partial<Record<GroupKey, Feedback>>>({});

  useEffect(() => {
    let cancelled = false;
    adminApi.get<{ data: SiteSetting[] }>("/admin/content/settings").then((response) => {
      if (cancelled) return;
      const hydrated = hydrateDrafts(response.data);
      setDrafts(hydrated);
      setSaved(hydrated);
    }).catch(() => {
      if (!cancelled) setError("Settings could not be loaded from the server.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const updateDraft = <K extends GroupKey>(group: K, values: Partial<SettingsDraft[K]>) => {
    setDrafts((current) => ({ ...current, [group]: { ...current[group], ...values } }));
    setFeedback((current) => ({ ...current, [group]: undefined }));
  };

  const saveSection = async (group: GroupKey) => {
    const draft = drafts[group];
    if (group === "contact" && drafts.contact.email && !/^\S+@\S+\.\S+$/.test(drafts.contact.email)) {
      setFeedback((current) => ({ ...current, contact: { type: "error", message: "Enter a valid email address." } }));
      return;
    }
    if (group === "shipping" && [drafts.shipping.shippingFee, drafts.shipping.freeShippingThreshold].some((value) => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      setFeedback((current) => ({ ...current, shipping: { type: "error", message: "Shipping amounts must be zero or greater." } }));
      return;
    }
    setSavingKey(group);
    setFeedback((current) => ({ ...current, [group]: undefined }));
    try {
      if (group === "seo") {
        await Promise.all([
          adminApi.put("/admin/content/settings/seo.title", { value: { title: drafts.seo.siteTitle } }),
          adminApi.put("/admin/content/settings/seo.description", { value: { description: drafts.seo.metaDescription } }),
          adminApi.put("/admin/content/settings/seo.socialImage", { value: { socialImage: drafts.seo.socialImage } }),
        ]);
      } else {
        await adminApi.put(`/admin/content/settings/${group === "general" ? "store.general" : group === "contact" ? "store.contact" : group === "shipping" ? "store.shipping" : group}`, { value: draft });
      }
      setSaved((current) => ({ ...current, [group]: { ...draft } }));
      setFeedback((current) => ({ ...current, [group]: { type: "success", message: "Changes saved." } }));
    } catch {
      setFeedback((current) => ({ ...current, [group]: { type: "error", message: "Changes could not be saved. Please try again." } }));
    } finally {
      setSavingKey(null);
    }
  };

  const cancelSection = (group: GroupKey) => {
    setDrafts((current) => ({ ...current, [group]: { ...saved[group] } }));
    setFeedback((current) => ({ ...current, [group]: undefined }));
  };

  if (loading) return <LoadingState message="Loading site settings." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return <main className="admin-content admin-settings-page">
    <div className="admin-heading admin-settings__heading"><div><p className="eyebrow">System</p><h1>Settings</h1><p className="admin-settings__intro">Manage the store details and communication preferences that shape the Kohisaar experience.</p></div><span className="admin-heading__status">Store configuration</span></div>
    <div className="admin-settings__grid">
      <SettingsCard sectionKey="store.general" title="General" description="The basic identity and operating status of your store." feedback={feedback.general} saving={savingKey === "general"} onSave={() => saveSection("general")} onCancel={() => cancelSection("general")}>
        <TextField label="Store name" value={drafts.general.storeName} onChange={(storeName) => updateDraft("general", { storeName })} />
        <SelectField label="Currency" value={drafts.general.currency} onChange={(currency) => updateDraft("general", { currency })} options={[{ value: "PKR", label: "PKR — Pakistani Rupee" }, { value: "USD", label: "USD — US Dollar" }]} />
        <SelectField label="Store status" value={drafts.general.status} onChange={(status) => updateDraft("general", { status })} options={[{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }]} />
      </SettingsCard>

      <SettingsCard sectionKey="store.contact" title="Contact" description="The direct contact details shown to customers and used for support." feedback={feedback.contact} saving={savingKey === "contact"} onSave={() => saveSection("contact")} onCancel={() => cancelSection("contact")}>
        <TextField label="Email" type="email" value={drafts.contact.email} onChange={(email) => updateDraft("contact", { email })} />
        <TextField label="Phone / WhatsApp" value={drafts.contact.phone} onChange={(phone) => updateDraft("contact", { phone })} />
        <TextField label="Business hours" value={drafts.contact.businessHours} onChange={(businessHours) => updateDraft("contact", { businessHours })} />
        <TextField label="Country" value={drafts.contact.country} onChange={(country) => updateDraft("contact", { country })} />
      </SettingsCard>

      <SettingsCard sectionKey="store.shipping" title="Shipping" description="Set the shipping information available to customers at checkout." feedback={feedback.shipping} saving={savingKey === "shipping"} onSave={() => saveSection("shipping")} onCancel={() => cancelSection("shipping")}>
        <TextField label="Shipping fee" type="number" value={drafts.shipping.shippingFee} onChange={(shippingFee) => updateDraft("shipping", { shippingFee })} placeholder="Not configured" />
        <TextField label="Free shipping threshold" type="number" value={drafts.shipping.freeShippingThreshold} onChange={(freeShippingThreshold) => updateDraft("shipping", { freeShippingThreshold })} />
        <TextField label="Estimated delivery" value={drafts.shipping.estimatedDelivery} onChange={(estimatedDelivery) => updateDraft("shipping", { estimatedDelivery })} />
        <TextField label="Shipping availability" value={drafts.shipping.shippingAvailability} onChange={(shippingAvailability) => updateDraft("shipping", { shippingAvailability })} placeholder="Not configured" />
      </SettingsCard>

      <SettingsCard sectionKey="seo" title="Search and social preview" description="Control the metadata used when Kohisaar pages appear in search and shared links." feedback={feedback.seo} saving={savingKey === "seo"} onSave={() => saveSection("seo")} onCancel={() => cancelSection("seo")}>
        <TextField label="Site title" value={drafts.seo.siteTitle} onChange={(siteTitle) => updateDraft("seo", { siteTitle })} />
        <label className="admin-settings__field admin-settings__field--wide"><span className="admin-settings__label">Meta description</span><textarea className="admin-settings__input" rows={4} value={drafts.seo.metaDescription} onChange={(event) => updateDraft("seo", { metaDescription: event.target.value })} /></label>
        <TextField label="Social image" value={drafts.seo.socialImage} onChange={(socialImage) => updateDraft("seo", { socialImage })} placeholder="Optional image URL or path" />
      </SettingsCard>

      <SettingsCard sectionKey="social" title="Social links" description="Add the public social profiles you want to make available across the store." feedback={feedback.social} saving={savingKey === "social"} onSave={() => saveSection("social")} onCancel={() => cancelSection("social")}>
        <TextField label="Instagram" type="url" value={drafts.social.instagram} onChange={(instagram) => updateDraft("social", { instagram })} placeholder="https://instagram.com/..." />
        <TextField label="Facebook" type="url" value={drafts.social.facebook} onChange={(facebook) => updateDraft("social", { facebook })} placeholder="https://facebook.com/..." />
        <TextField label="WhatsApp" type="url" value={drafts.social.whatsapp} onChange={(whatsapp) => updateDraft("social", { whatsapp })} placeholder="Optional link" />
      </SettingsCard>

      <SettingsCard sectionKey="notifications" title="Notifications" description="Demo preferences for future store alerts. These toggles do not send notifications yet." feedback={feedback.notifications} saving={savingKey === "notifications"} onSave={() => saveSection("notifications")} onCancel={() => cancelSection("notifications")}>
        <ToggleField label="New order notifications" description="Prepare to receive an alert when an order is placed." checked={drafts.notifications.newOrders} onChange={(newOrders) => updateDraft("notifications", { newOrders })} />
        <ToggleField label="Low stock notifications" description="Prepare to receive an alert when inventory is running low." checked={drafts.notifications.lowStock} onChange={(lowStock) => updateDraft("notifications", { lowStock })} />
        <ToggleField label="New review notifications" description="Prepare to receive an alert when a customer submits a review." checked={drafts.notifications.newReviews} onChange={(newReviews) => updateDraft("notifications", { newReviews })} />
      </SettingsCard>
    </div>
  </main>;
}
