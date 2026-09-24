import { z } from "zod";

export const inventoryVariantParamsSchema = z.object({ variantId: z.uuid() });
export const inventoryAdjustmentSchema = z.object({ stockDelta: z.number().int().min(-100000).max(100000), lowStockThreshold: z.number().int().min(0).max(100000).optional() });
