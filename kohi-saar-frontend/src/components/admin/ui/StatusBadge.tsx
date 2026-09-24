"use client";

type Variant = "default" | "success" | "warning" | "error" | "info";

const variantStyles: Record<Variant, { bg: string; color: string; border: string }> = {
  default: {
    bg: "rgba(111, 108, 99, 0.08)",
    color: "#6F6C63",
    border: "rgba(111, 108, 99, 0.2)",
  },
  success: {
    bg: "rgba(79, 107, 85, 0.1)",
    color: "#4F6B55",
    border: "rgba(79, 107, 85, 0.25)",
  },
  warning: {
    bg: "rgba(154, 117, 64, 0.1)",
    color: "#9A7540",
    border: "rgba(154, 117, 64, 0.25)",
  },
  error: {
    bg: "rgba(139, 74, 67, 0.1)",
    color: "#8B4A43",
    border: "rgba(139, 74, 67, 0.25)",
  },
  info: {
    bg: "rgba(83, 104, 117, 0.1)",
    color: "#536875",
    border: "rgba(83, 104, 117, 0.25)",
  },
};

const statusVariantMap: Record<string, Variant> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "success",
  DELIVERED: "success",
  FULFILLED: "success",
  CANCELLED: "error",
  RETURNED: "error",
  ACTIVE: "success",
  AVAILABLE: "success",
  INACTIVE: "default",
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "default",
  APPROVED: "success",
  REJECTED: "error",
  UNAVAILABLE: "error",
  PREORDER: "warning",
  IN_STOCK: "success",
  HEALTHY: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "error",
};

export function StatusBadge({
  status,
  variant,
}: {
  status: string;
  variant?: Variant;
}) {
  const normKey = status.toUpperCase().replace(/\s+/g, "_");
  const resolved = variant ?? statusVariantMap[normKey] ?? "default";
  const st = variantStyles[resolved];

  return (
    <span
      className="admin-status-badge"
      style={{
        backgroundColor: st.bg,
        color: st.color,
        borderColor: st.border,
      }}
    >
      <span
        className="admin-status-badge__dot"
        style={{ backgroundColor: st.color }}
        aria-hidden="true"
      />
      {status.replace(/_/g, " ")}
    </span>
  );
}
