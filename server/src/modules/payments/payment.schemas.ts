import { z } from "zod";

export const paymentOrderParamsSchema = z.object({ orderNumber: z.string().trim().min(8).max(100) });
export const paymentIdempotencySchema = z.object({ idempotencyKey: z.string().trim().min(16).max(100) });
export const paymentProviderParamsSchema = z.object({ provider: z.string().trim().min(1).max(80) });
