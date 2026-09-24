import { OrderStatus, Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/AppError.js";
import { prisma } from "../../common/database/prisma.js";
import { commitShipmentInventory, releaseInventory } from "../inventory/inventory.service.js";

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  FULFILLED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

export async function transitionOrder(orderNumber: string, nextStatus: OrderStatus, userId?: string) {
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { orderNumber }, select: { id: true, status: true, items: { select: { variantId: true, quantity: true } } } });
    if (!order) throw new AppError(404, "Order not found.", "ORDER_NOT_FOUND");
    if (!transitions[order.status].includes(nextStatus)) throw new AppError(409, `Cannot move order from ${order.status} to ${nextStatus}.`, "INVALID_ORDER_TRANSITION");
    const items = order.items.filter((item): item is { variantId: string; quantity: number } => item.variantId !== null);
    if (nextStatus === "CANCELLED") await releaseInventory(transaction, items, order.id, "ORDER_CANCELLED");
    if (nextStatus === "SHIPPED") await commitShipmentInventory(transaction, items, order.id);
    if (nextStatus === "RETURNED") {
      for (const item of items) {
        const variant = await transaction.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } }, select: { stockQuantity: true, reservedQuantity: true } });
        await transaction.inventoryHistory.create({ data: { variantId: item.variantId, orderId: order.id, userId, stockDelta: item.quantity, reservedDelta: 0, stockQuantityAfter: variant.stockQuantity, reservedQuantityAfter: variant.reservedQuantity, reason: "ORDER_RETURNED" } });
      }
    }
    const updated = await transaction.order.update({ where: { id: order.id }, data: { status: nextStatus }, select: { orderNumber: true, status: true, updatedAt: true } });
    if (userId) await transaction.auditLog.create({ data: { userId, action: `ORDER_STATUS_${nextStatus}`, entity: "Order", entityId: order.id, metadata: { from: order.status, to: nextStatus } as Prisma.InputJsonValue } });
    return updated;
  }, { isolationLevel: "Serializable" });
}
