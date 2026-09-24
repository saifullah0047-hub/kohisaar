import { Router } from "express";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { validateBody } from "../../common/middleware/validate.js";
import { cartItemSchema, cartQuantitySchema, cartVariantParamsSchema } from "./cart.schemas.js";
import { cartSelect, getOrCreateCart, publicCart, requireCart, sessionTokenFrom } from "./cart.service.js";

export const cartRouter = Router();

cartRouter.get("/", asyncHandler(async (request, response) => {
  const cart = await getOrCreateCart(sessionTokenFrom(request));
  response.json({ data: publicCart(cart) });
}));

cartRouter.post("/items", validateBody(cartItemSchema), asyncHandler(async (request, response) => {
  const cart = await getOrCreateCart(sessionTokenFrom(request));
  const { variantId, quantity } = request.body as { variantId: string; quantity: number };
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { id: true, product: { select: { availability: true } } } });
  if (!variant) throw new AppError(404, "Product variant not found.", "VARIANT_NOT_FOUND");
  if (variant.product.availability === "UNAVAILABLE") throw new AppError(409, "This product is unavailable.", "PRODUCT_UNAVAILABLE");
  const existingItem = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } }, select: { quantity: true } });
  if ((existingItem?.quantity ?? 0) + quantity > 99) throw new AppError(400, "Cart quantity cannot exceed 99.", "QUANTITY_LIMIT_EXCEEDED");
  await prisma.cartItem.upsert({ where: { cartId_variantId: { cartId: cart.id, variantId } }, create: { cartId: cart.id, variantId, quantity }, update: { quantity: { increment: quantity } } });
  const updated = await prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, select: cartSelect });
  response.status(201).json({ data: publicCart(updated) });
}));

cartRouter.patch("/items/:variantId", validateBody(cartQuantitySchema), asyncHandler(async (request, response) => {
  const { variantId } = cartVariantParamsSchema.parse(request.params);
  const cart = await requireCart(sessionTokenFrom(request));
  const { quantity } = request.body as { quantity: number };
  const item = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } }, select: { id: true, variant: { select: { product: { select: { availability: true } } } } } });
  if (!item) throw new AppError(404, "Cart item not found.", "CART_ITEM_NOT_FOUND");
  if (item.variant.product.availability === "UNAVAILABLE") throw new AppError(409, "This product is unavailable.", "PRODUCT_UNAVAILABLE");
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  const updated = await prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, select: cartSelect });
  response.json({ data: publicCart(updated) });
}));

cartRouter.delete("/items/:variantId", asyncHandler(async (request, response) => {
  const { variantId } = cartVariantParamsSchema.parse(request.params);
  const cart = await requireCart(sessionTokenFrom(request));
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  const updated = await prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, select: cartSelect });
  response.json({ data: publicCart(updated) });
}));

cartRouter.delete("/", asyncHandler(async (request, response) => {
  const cart = await requireCart(sessionTokenFrom(request));
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  response.status(204).send();
}));
