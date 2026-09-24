import { z } from "zod";

export const reviewProductParamsSchema = z.object({ productId: z.uuid() });
export const reviewParamsSchema = z.object({ id: z.uuid() });
export const reviewCreateSchema = z.object({ rating: z.number().int().min(1).max(5), title: z.string().trim().max(200).optional(), body: z.string().trim().min(10).max(5000) });
export const reviewStatusSchema = z.object({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]) });
