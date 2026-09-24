import { Router } from "express";
import { prisma } from "../../common/database/prisma.js";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { requireAuthentication, requireRole } from "../../common/middleware/auth.js";
import { availableQuantity, adjustInventory, inventoryHistory } from "../inventory/inventory.service.js";
import { inventoryAdjustmentSchema, inventoryVariantParamsSchema } from "../inventory/inventory.schemas.js";
import { validateBody } from "../../common/middleware/validate.js";
import { z } from "zod";

export const adminRouter = Router();
adminRouter.use(requireAuthentication, requireRole("admin"));

adminRouter.get("/dashboard", asyncHandler(async (_request, response) => {
  const [products, categories, orders, customers, reviews, recentOrders, revenueAggregate] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.review.count(),
    prisma.order.findMany({
      select: { orderNumber: true, email: true, status: true, total: true, currency: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: ["CANCELLED", "RETURNED"] } },
    }),
  ]);
  response.json({
    data: {
      counts: { products, categories, orders, customers, reviews },
      revenueTotal: Number(revenueAggregate._sum.total ?? 0),
      recentOrders: recentOrders.map((order) => ({ ...order, total: Number(order.total) })),
    },
  });
}));

adminRouter.get("/products", asyncHandler(async (_request, response) => {
  const data = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      description: true,
      availability: true,
      featured: true,
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          stockQuantity: true,
          reservedQuantity: true,
          lowStockThreshold: true,
        },
        orderBy: { createdAt: "asc" },
      },
      images: {
        select: { src: true, alt: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  response.json({
    data: data.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        price: Number(variant.price),
        availableQuantity: availableQuantity(variant.stockQuantity, variant.reservedQuantity),
      })),
    })),
  });
}));

adminRouter.get("/inventory/history", asyncHandler(async (request, response) => response.json({ data: await inventoryHistory(typeof request.query.variantId === "string" ? request.query.variantId : undefined) })));
adminRouter.patch("/inventory/:variantId", validateBody(inventoryAdjustmentSchema), asyncHandler(async (request, response) => {
  const { variantId } = inventoryVariantParamsSchema.parse(request.params);
  const userId = (request as import("../../common/middleware/auth.js").AuthenticatedRequest).user?.id;
  if (!userId) throw new Error("Authenticated admin context missing");
  response.json({ data: await adjustInventory(variantId, request.body.stockDelta as number, request.body.lowStockThreshold as number | undefined, userId) });
}));

adminRouter.get("/orders", asyncHandler(async (_request, response) => {
  const data = await prisma.order.findMany({ select: { orderNumber: true, email: true, status: true, total: true, currency: true, createdAt: true, payments: { select: { method: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } });
  response.json({ data: data.map((order) => ({ ...order, total: Number(order.total), payment: order.payments[0] ?? null })) });
}));

adminRouter.get("/orders/:orderNumber", asyncHandler(async (request, response) => {
  const order = await prisma.order.findUnique({ where: { orderNumber: z.string().parse(request.params.orderNumber) }, select: { orderNumber: true, email: true, status: true, currency: true, subtotal: true, shippingAmount: true, discountAmount: true, total: true, createdAt: true, address: true, items: { select: { productName: true, variantName: true, quantity: true, unitPrice: true, lineTotal: true } }, payments: { select: { method: true, status: true, amount: true, currency: true } } } });
  if (!order) return response.status(404).json({ error: { code: "ORDER_NOT_FOUND", message: "Order not found." } });
  response.json({ data: { ...order, subtotal: Number(order.subtotal), shippingAmount: Number(order.shippingAmount), discountAmount: Number(order.discountAmount), total: Number(order.total), items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })), payments: order.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })) } });
}));

adminRouter.get("/customers", asyncHandler(async (_request, response) => {
  const data = await prisma.user.findMany({ select: { id: true, fullName: true, email: true, phone: true, createdAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" } });
  response.json({ data: data.map((customer) => ({ ...customer, orderCount: customer._count.orders })) });
}));

adminRouter.get("/audit-logs", asyncHandler(async (_request, response) => {
  const data = await prisma.auditLog.findMany({ select: { id: true, action: true, entity: true, entityId: true, createdAt: true, user: { select: { id: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  response.json({ data });
}));
