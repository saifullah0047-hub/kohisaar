"use client";

export function ErrorState({
  message = "Records could not be loaded.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="admin-error-state" role="alert">
      <p className="admin-error-state__message">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="admin-error-state__retry"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}
