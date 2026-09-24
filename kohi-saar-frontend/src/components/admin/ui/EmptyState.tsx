"use client";

import type { ReactNode } from "react";

export function EmptyState({
  icon,
  heading,
  body,
  action,
  className = "",
}: {
  icon?: ReactNode;
  heading: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`admin-empty ${className}`}>
      {icon && <div className="admin-empty__icon-wrap">{icon}</div>}
      <p className="admin-empty__heading">{heading}</p>
      {body && <p className="admin-empty__body">{body}</p>}
      {action && <div className="admin-empty__action">{action}</div>}
    </div>
  );
}
