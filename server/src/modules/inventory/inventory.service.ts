import { Prisma } from "@prisma/client";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";

export function availableQuantity(stockQuantity: number, reservedQuantity: number) {
  return Math.max(0, stockQuantity - reservedQuantity);
}

export async function reserveInventory(transaction: Prisma.TransactionClient, items: Array<{ variantId: string; quantity: number }>, orderId: string) {
  for (const item of items) {
    const current = await transaction.productVariant.findUnique({ where: { id: item.variantId }, select: { stockQuantity: true, reservedQuantity: true } });
    if (!current || availableQuantity(current.stockQuantity, current.reservedQuantity) < item.quantity) throw new AppError(409, "One or more products do not have enough available stock.", "INSUFFICIENT_STOCK");
    const updated = await transaction.productVariant.updateMany({ where: { id: item.variantId, reservedQuantity: current.reservedQuantity }, data: { reservedQuantity: { increment: item.quantity } } });
    if (updated.count !== 1) throw new AppError(409, "One or more products do not have enough available stock.", "INSUFFICIENT_STOCK");
    const variant = await transaction.productVariant.findUniqueOrThrow({ where: { id: item.variantId }, select: { stockQuantity: true, reservedQuantity: true } });
    await transaction.inventoryHistory.create({ data: { variantId: item.variantId, orderId, stockDelta: 0, reservedDelta: item.quantity, stockQuantityAfter: variant.stockQuantity, reservedQuantityAfter: variant.reservedQuantity, reason: "ORDER_RESERVED" } });
  }
}

export async function releaseInventory(transaction: Prisma.TransactionClient, items: Array<{ variantId: string; quantity: number }>, orderId: string, reason: "ORDER_CANCELLED" | "ORDER_RETURNED") {
  for (const item of items) {
    const updated = await transaction.productVariant.updateMany({ where: { id: item.variantId, reservedQuantity: { gte: item.quantity } }, data: { reservedQuantity: { decrement: item.quantity } } });
    if (updated.count !== 1) throw new AppError(409, "Reserved inventory is inconsistent.", "INVENTORY_CONFLICT");
    const variant = await transaction.productVariant.findUniqueOrThrow({ where: { id: item.variantId }, select: { stockQuantity: true, reservedQuantity: true } });
    await transaction.inventoryHistory.create({ data: { variantId: item.variantId, orderId, stockDelta: 0, reservedDelta: -item.quantity, stockQuantityAfter: variant.stockQuantity, reservedQuantityAfter: variant.reservedQuantity, reason } });
  }
}

export async function commitShipmentInventory(transaction: Prisma.TransactionClient, items: Array<{ variantId: string; quantity: number }>, orderId: string) {
  for (const item of items) {
    const updated = await transaction.productVariant.updateMany({ where: { id: item.variantId, stockQuantity: { gte: item.quantity }, reservedQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity }, reservedQuantity: { decrement: item.quantity } } });
    if (updated.count !== 1) throw new AppError(409, "Inventory could not be committed for shipment.", "INVENTORY_CONFLICT");
    const variant = await transaction.productVariant.findUniqueOrThrow({ where: { id: item.variantId }, select: { stockQuantity: true, reservedQuantity: true } });
    await transaction.inventoryHistory.create({ data: { variantId: item.variantId, orderId, stockDelta: -item.quantity, reservedDelta: -item.quantity, stockQuantityAfter: variant.stockQuantity, reservedQuantityAfter: variant.reservedQuantity, reason: "ORDER_SHIPPED" } });
  }
}

export async function adjustInventory(variantId: string, stockDelta: number, lowStockThreshold: number | undefined, userId: string) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.productVariant.findUnique({ where: { id: variantId }, select: { stockQuantity: true, reservedQuantity: true, lowStockThreshold: true } });
    if (!current) throw new AppError(404, "Product variant not found.", "VARIANT_NOT_FOUND");
    if (current.stockQuantity + stockDelta < current.reservedQuantity) throw new AppError(409, "Stock cannot be lower than reserved quantity.", "INVENTORY_CONFLICT");
    const variant = await transaction.productVariant.update({ where: { id: variantId }, data: { stockQuantity: { increment: stockDelta }, ...(lowStockThreshold === undefined ? {} : { lowStockThreshold }) }, select: { id: true, stockQuantity: true, reservedQuantity: true, lowStockThreshold: true } });
    await transaction.inventoryHistory.create({ data: { variantId, userId, stockDelta, reservedDelta: 0, stockQuantityAfter: variant.stockQuantity, reservedQuantityAfter: variant.reservedQuantity, reason: "ADMIN_ADJUSTMENT" } });
    return { ...variant, availableQuantity: availableQuantity(variant.stockQuantity, variant.reservedQuantity) };
  });
}

export async function inventoryHistory(variantId?: string) {
  return prisma.inventoryHistory.findMany({ where: variantId ? { variantId } : undefined, select: { id: true, variantId: true, orderId: true, stockDelta: true, reservedDelta: true, stockQuantityAfter: true, reservedQuantityAfter: true, reason: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 200 });
}
