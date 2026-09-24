import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { CartView } from "@/components/cart/CartView";

export default function CartPage() {
  return <><Navbar /><main className="cart-page"><CartView /></main><Footer /></>;
}
