import { CartProvider } from "@/components/cart/CartProvider";
import { DrawerProvider } from "@/components/cart/DrawerProvider";
import { MiniCartDrawer } from "@/components/cart/MiniCartDrawer";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";

export default function StorefrontLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <DrawerProvider>
        <ToastProvider>
          {children}
          <MiniCartDrawer />
          <ConsentBanner />
        </ToastProvider>
      </DrawerProvider>
    </CartProvider>
  );
}
