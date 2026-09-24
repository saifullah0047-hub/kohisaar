import { z } from "zod";

export const productIdParamsSchema = z.object({ id: z.uuid() });
export const productSlugParamsSchema = z.object({ slug: z.string().trim().min(1).max(160) });
export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "name", "price-asc", "price-desc"]).default("newest"),
});

export const productWriteSchema = z.object({
  categoryId: z.uuid(),
  slug: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(200),
  shortDescription: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1),
  availability: z.enum(["AVAILABLE", "UNAVAILABLE", "PREORDER"]).optional(),
  featured: z.boolean().optional(),
  price: z.number().nonnegative().optional(),
  compareAtPrice: z.number().nonnegative().optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  variantName: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  imageSrc: z.string().trim().optional(),
  imageAlt: z.string().trim().optional(),
});
export const variantWriteSchema = z.object({
  name: z.string().trim().min(1).max(160),
  sku: z.string().trim().min(1).max(120),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional().nullable(),
  currency: z.string().trim().length(3),
  stockQuantity: z.number().int().min(0).default(0).optional(),
  inventoryQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).default(0).optional(),
});
export const imageWriteSchema = z.object({
  src: z.string().trim().min(1).max(1000),
  alt: z.string().trim().min(1).max(300),
  sortOrder: z.number().int().min(0).default(0),
});
export const inventoryWriteSchema = z.object({
  stockQuantity: z.number().int().min(0).optional(),
  inventoryQuantity: z.number().int().min(0).optional(),
});
