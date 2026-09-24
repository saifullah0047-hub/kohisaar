"use client";

import "../../styles/admin.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  ShoppingCart,
  Users,

  Star,
  FileText,
  HelpCircle,
  BarChart3,
  Settings,
  ClipboardList,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { BrandedLoadingScreen } from "@/components/loading/BrandedLoadingScreen";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "COMMERCE",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Journal", href: "/admin/journal", icon: FileText },
      { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList },
    ],
  },
] as const;

function getBreadcrumb(pathname: string): string {
  if (pathname === "/admin") return "Overview";
  const segment = pathname.split("/admin/")[1]?.split("/")[0];
  if (!segment) return "Overview";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  const [session, setSession] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [loading, setLoading] = useState(() => !isLoginPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sessionCheck, setSessionCheck] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (isLoginPage) return;

    const controller = new AbortController();
    fetch(`${API_BASE_URL}/auth/admin/session`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          setSession(false);
          return;
        }
        if (!response.ok) throw new Error("Session check failed");
        await response.json();
        setSession(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSession(false);
          setSessionError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isLoginPage, sessionCheck]);

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return <BrandedLoadingScreen message="Checking admin access" />;
  }

  if (sessionError) {
    return (
      <main className="admin-gate" role="alert">
        <ShieldAlert size={40} style={{ color: "var(--adm-accent, #A88B55)", marginBottom: 12 }} />
        <p className="eyebrow">Kohisaar Administration</p>
        <h1>Admin service unavailable.</h1>
        <p>We could not verify your session. Check your connection and try again.</p>
        <button className="admin-btn admin-btn--primary" type="button" onClick={() => { setLoading(true); setSessionError(false); setSessionCheck((value) => value + 1); }} style={{ marginTop: 24 }}>
          Try again
        </button>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-gate">
        <ShieldAlert size={40} style={{ color: "var(--adm-accent, #A88B55)", marginBottom: 12 }} />
        <p className="eyebrow">Kohisaar Administration</p>
        <h1>Protected admin access.</h1>
        <p>Sign in with an authorized administrator account to continue.</p>
        <Link className="admin-btn admin-btn--primary" href="/admin/login" style={{ marginTop: 24 }}>
          Admin sign in
        </Link>
      </main>
    );
  }

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push("/admin/login");
    }
  };

  const breadcrumb = getBreadcrumb(pathname);
  const todayFormatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date()).toUpperCase();

  return (
    <div className="admin-app">
      {sidebarOpen && (
        <div
          className="admin-sidebar__backdrop admin-sidebar__backdrop--open"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`admin-sidebar${sidebarOpen ? " admin-sidebar--open" : ""}`}>
        {/* Brand Header — Stacked, Left-Aligned */}
        <div className="admin-sidebar__header">
          <Link className="admin-sidebar__brand" href="/admin">
            <Image
              src="/images/kohi-saar-logo.jpeg"
              alt="Kohisaar"
              width={48}
              height={48}
              priority
              className="admin-sidebar__logo"
            />
            <span className="admin-sidebar__brand-name">KOHISAAR</span>
            <span className="admin-sidebar__brand-tag">ADMIN</span>
          </Link>
          <button
            type="button"
            className="admin-sidebar__close--mobile"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="admin-sidebar__group">
              <span className="admin-sidebar__group-label">{group.label}</span>
              <ul className="admin-sidebar__list">
                {group.items.map(({ label, href, icon: Icon }) => {
                  const isActive =
                    href === "/admin"
                      ? pathname === "/admin"
                      : pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="admin-sidebar__icon">
                          <Icon size={16} strokeWidth={1.75} />
                        </span>
                        <span className="admin-sidebar__label">{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar__bottom">
          <Link
            href="/"
            className="admin-sidebar__storefront-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>View Storefront</span>
            <ExternalLink size={13} strokeWidth={1.75} />
          </Link>

          <div className="admin-sidebar__admin-card">
            <div className="admin-sidebar__avatar">A</div>
            <div className="admin-sidebar__admin-meta">
              <span className="admin-sidebar__admin-name">Administrator</span>
              <span className="admin-sidebar__admin-role">Store Operations</span>
            </div>
            <button
              className="admin-sidebar__logout-btn"
              type="button"
              onClick={logout}
              disabled={loggingOut}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              className="admin-topbar__menu-btn"
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-expanded={sidebarOpen}
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <nav className="admin-topbar__breadcrumb" aria-label="Breadcrumb">
              <Link href="/admin" className="admin-topbar__breadcrumb-root">
                KOHISAAR
              </Link>
              <span className="admin-topbar__breadcrumb-sep">/</span>
              <span className="admin-topbar__breadcrumb-current">
                {breadcrumb}
              </span>
            </nav>
          </div>

          <div className="admin-topbar__right">
            <span className="admin-topbar__date">{todayFormatted}</span>
            <span className="admin-topbar__divider" />
            <Link
              href="/"
              className="admin-topbar__storefront-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Storefront</span>
              <ExternalLink size={12} strokeWidth={1.75} />
            </Link>
            <span className="admin-topbar__divider" />
            <div className="admin-topbar__user-chip">
              <span className="admin-topbar__user-dot" />
              <span className="admin-topbar__user-label">Admin</span>
            </div>
          </div>
        </header>

         <div className="admin-page-content">
           {children}
         </div>
      </div>
    </div>
  );
}
