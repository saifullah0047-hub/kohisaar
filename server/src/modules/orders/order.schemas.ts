import { z } from "zod";

export const orderNumberParamsSchema = z.object({ orderNumber: z.string().trim().min(8).max(100) });
export const createOrderSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2).max(200),
    email: z.email(),
    phone: z.string().trim().min(7).max(40),
    address: z.string().trim().min(5).max(300),
    city: z.string().trim().min(2).max(120),
    region: z.string().trim().min(2).max(120),
    postalCode: z.string().trim().min(3).max(30),
    notes: z.string().trim().max(1000).optional().default(""),
  }),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "ONLINE"]),
  couponCode: z.string().trim().max(80).optional(),
});
