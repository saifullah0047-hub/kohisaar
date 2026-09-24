"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface Toast {
  id: number;
  message: string;
  description?: string;
  variant: "success" | "error";
}

interface ToastContextValue {
  showToast: (message: string, options?: { description?: string; variant?: "success" | "error" }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, options?: { description?: string; variant?: "success" | "error" }) => {
    const id = ++toastId;
    const toast: Toast = { id, message, description: options?.description, variant: options?.variant ?? "success" };
    setToasts((prev) => [...prev, toast]);
    timers.current.set(id, setTimeout(() => removeToast(id), 4000));
  }, [removeToast]);

  useEffect(() => {
    const currentTimers = timers.current;
    return () => { currentTimers.forEach((timer) => clearTimeout(timer)); };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.variant}`} role="status">
            <div className="toast__content">
              <p className="toast__message">{toast.message}</p>
              {toast.description ? <p className="toast__description">{toast.description}</p> : null}
            </div>
            <button className="toast__dismiss" type="button" aria-label="Dismiss notification" onClick={() => removeToast(toast.id)}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
