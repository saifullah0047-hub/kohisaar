import type { PaymentStatus } from "@prisma/client";

export interface PaymentCreationInput {
  orderNumber: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  customerEmail: string;
}

export interface PaymentCreationResult {
  providerReference: string;
  redirectUrl?: string;
  status: PaymentStatus;
}

export interface VerifiedPaymentEvent {
  eventId: string;
  providerReference: string;
  status: Extract<PaymentStatus, "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" | "CANCELLED">;
  payloadHash: string;
}

export interface PaymentProvider {
  name: string;
  createPayment: (input: PaymentCreationInput) => Promise<PaymentCreationResult>;
  cancelPayment: (providerReference: string) => Promise<void>;
  verifyWebhook: (rawBody: Buffer, signature: string | undefined) => VerifiedPaymentEvent;
}

// A concrete provider is registered only after market, credentials, and webhook rules are approved.
export const paymentProviders = new Map<string, PaymentProvider>();
