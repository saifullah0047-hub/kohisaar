import { randomUUID } from "node:crypto";
import { Prisma, ProductAvailability } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";

export const cartSelect = {
  id: true,
  sessionToken: true,
  items: { select: { id: true, variantId: true, quantity: true, variant: { select: { id: true, name: true, price: true, compareAtPrice: true, currency: true, product: { select: { id: true, slug: true, name: true, shortDescription: true, description: true, availability: true, featured: true, category: { select: { id: true, name: true, slug: true } }, images: { select: { id: true, src: true, alt: true, sortOrder: true }, orderBy: { sortOrder: "asc" } } } } } } } },
} satisfies Prisma.CartSelect;
export type CartWithItems = Prisma.CartGetPayload<{ select: typeof cartSelect }>;

export function sessionTokenFrom(request: Request) {
  const token = request.header("x-cart-session")?.trim();
  return token && token.length <= 200 ? token : undefined;
}

export async function getOrCreateCart(sessionToken?: string) {
  if (sessionToken) {
    const existing = await prisma.cart.findUnique({ where: { sessionToken }, select: cartSelect });
    if (existing) return existing;
  }
  return prisma.cart.create({ data: { sessionToken: randomUUID() }, select: cartSelect });
}

export async function requireCart(sessionToken: string | undefined) {
  if (!sessionToken) throw new AppError(400, "A cart session is required.", "CART_SESSION_REQUIRED");
  const cart = await prisma.cart.findUnique({ where: { sessionToken }, select: cartSelect });
  if (!cart) throw new AppError(404, "Cart not found.", "CART_NOT_FOUND");
  return cart;
}

export function publicCart(cart: CartWithItems) {
  const items = cart.items.map((item) => ({ id: item.id, variantId: item.variantId, quantity: item.quantity, product: item.variant.product, variant: { id: item.variant.id, name: item.variant.name, price: Number(item.variant.price), compareAtPrice: item.variant.compareAtPrice == null ? null : Number(item.variant.compareAtPrice), currency: item.variant.currency }, available: item.variant.product.availability === ProductAvailability.AVAILABLE || item.variant.product.availability === ProductAvailability.PREORDER, lineTotal: Number(item.variant.price) * item.quantity }));
  const availableItems = items.filter((item) => item.available);
  const currency = availableItems[0]?.variant.currency ?? null;
  return { id: cart.id, sessionToken: cart.sessionToken, items, itemCount: cart.items.reduce((total, item) => total + item.quantity, 0), subtotal: availableItems.reduce((total, item) => total + item.lineTotal, 0), currency };
}
