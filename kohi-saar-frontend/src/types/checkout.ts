import type { CartItem } from "@/types/cart";

export type PaymentMethod = "cash-on-delivery" | "online";

export interface CheckoutCustomer {
  fullName: string;
  email: string;
  phone: string;
}

export interface CheckoutShipping extends CheckoutCustomer {
  address: string;
  city: string;
  region: string;
  postalCode: string;
  notes: string;
}

export interface CheckoutPayload {
  customer: CheckoutShipping;
  paymentMethod: PaymentMethod;
  items: CartItem[];
}

export interface CheckoutResult {
  orderNumber: string;
}

export type CheckoutSubmit = (payload: CheckoutPayload) => Promise<CheckoutResult>;
