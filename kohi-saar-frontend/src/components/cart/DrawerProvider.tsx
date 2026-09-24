"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface DrawerContextValue {
  drawerOpen: boolean;
  openDrawer: (productName?: string) => void;
  closeDrawer: () => void;
  addedProductName: string | null;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function DrawerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addedProductName, setAddedProductName] = useState<string | null>(null);

  const openDrawer = useCallback((productName?: string) => {
    setAddedProductName(productName ?? null);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setAddedProductName(null);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", handleEscape);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <DrawerContext.Provider value={{ drawerOpen, openDrawer, closeDrawer, addedProductName }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer(): DrawerContextValue {
  const context = useContext(DrawerContext);
  if (!context) throw new Error("useDrawer must be used within DrawerProvider");
  return context;
}
