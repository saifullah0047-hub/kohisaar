import type { Product, ProductVariant } from "@/types/product";

export interface CartItem {
  productId: Product["id"];
  quantity: number;
  variantId?: string;
  product?: Product;
}

export interface CartState {
  items: CartItem[];
  sessionToken?: string;
}

export interface CartActions {
  addItem: (product: Product, quantity: number, variantId?: string) => CartActionResult;
  removeItem: (productId: Product["id"], variantId?: string) => void;
  updateQuantity: (productId: Product["id"], quantity: number, variantId?: string) => void;
  increaseQuantity: (productId: Product["id"], variantId?: string) => void;
  decreaseQuantity: (productId: Product["id"], variantId?: string) => void;
  clearCart: () => void;
}

export interface CartActionResult {
  success: boolean;
  message?: string;
}

export interface CartLine {
  item: CartItem;
  product: Product | null;
  variant?: ProductVariant;
  available: boolean;
  unitPrice: number;
  currency: string;
  lineTotal: number;
}
