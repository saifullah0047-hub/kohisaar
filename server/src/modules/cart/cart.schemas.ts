import { z } from "zod";

export const cartItemSchema = z.object({ variantId: z.uuid(), quantity: z.coerce.number().int().min(1).max(99) });
export const cartQuantitySchema = z.object({ quantity: z.coerce.number().int().min(1).max(99) });
export const cartVariantParamsSchema = z.object({ variantId: z.uuid() });
