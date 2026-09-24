import { randomUUID } from "node:crypto";
import { Prisma, ProductAvailability } from "@prisma/client";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { reserveInventory } from "../inventory/inventory.service.js";

interface CreateOrderInput {
  customer: { fullName: string; email: string; phone: string; address: string; city: string; region: string; postalCode: string; notes: string };
  paymentMethod: "CASH_ON_DELIVERY" | "ONLINE";
  couponCode?: string;
}

const orderCartSelect = {
  id: true,
  items: { select: { variantId: true, quantity: true, variant: { select: { id: true, name: true, sku: true, price: true, currency: true, product: { select: { id: true, name: true, availability: true } } } } } },
} satisfies Prisma.CartSelect;

export async function createOrder(sessionToken: string | undefined, input: CreateOrderInput) {
  if (!sessionToken) throw new AppError(400, "A cart session is required.", "CART_SESSION_REQUIRED");
  const shippingFlatAmount = env.SHIPPING_FLAT_AMOUNT;
  if (shippingFlatAmount === undefined) throw new AppError(503, "Shipping calculation is not configured.", "SHIPPING_NOT_CONFIGURED");
  if (input.paymentMethod === "ONLINE") throw new AppError(501, "Online payment is not configured.", "PAYMENT_NOT_CONFIGURED");

  return prisma.$transaction(async (transaction) => {
    const cart = await transaction.cart.findUnique({ where: { sessionToken }, select: orderCartSelect });
    if (!cart) throw new AppError(404, "Cart not found.", "CART_NOT_FOUND");
    if (cart.items.length === 0) throw new AppError(400, "Cannot create an order from an empty cart.", "CART_EMPTY");
    if (cart.items.some((item) => item.variant.product.availability !== ProductAvailability.AVAILABLE && item.variant.product.availability !== ProductAvailability.PREORDER)) throw new AppError(409, "One or more products are unavailable.", "PRODUCT_UNAVAILABLE");

    const currencies = new Set(cart.items.map((item) => item.variant.currency));
    if (currencies.size !== 1) throw new AppError(409, "Cart contains products with incompatible currencies.", "CURRENCY_MISMATCH");
    const currency = cart.items[0]?.variant.currency;
    if (!currency) throw new AppError(409, "Cart pricing is incomplete.", "PRICE_NOT_CONFIGURED");

    const subtotal = cart.items.reduce((sum, item) => sum.add(new Prisma.Decimal(item.variant.price).mul(item.quantity)), new Prisma.Decimal(0));
    let discountAmount = new Prisma.Decimal(0);
    let couponId: string | undefined;
    if (input.couponCode) {
      const coupon = await transaction.coupon.findUnique({ where: { code: input.couponCode }, select: { id: true, discountType: true, value: true, startsAt: true, expiresAt: true, maxUses: true, isActive: true, _count: { select: { usages: true } } } });
      const now = new Date();
      if (!coupon || !coupon.isActive || (coupon.startsAt && coupon.startsAt > now) || (coupon.expiresAt && coupon.expiresAt < now) || (coupon.maxUses !== null && coupon._count.usages >= coupon.maxUses)) throw new AppError(409, "Coupon is not available.", "COUPON_UNAVAILABLE");
      couponId = coupon.id;
      discountAmount = coupon.discountType === "PERCENTAGE" ? subtotal.mul(coupon.value).div(100) : Prisma.Decimal.min(subtotal, coupon.value);
    }
    const shippingAmount = new Prisma.Decimal(shippingFlatAmount);
    const total = subtotal.add(shippingAmount).sub(discountAmount);
    const orderNumber = `KS-${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`;
    const order = await transaction.order.create({ data: { orderNumber, email: input.customer.email, status: "PENDING", currency, subtotal, shippingAmount, discountAmount, total, items: { create: cart.items.map((item) => ({ variantId: item.variantId, productName: item.variant.product.name, variantName: item.variant.name, sku: item.variant.sku, unitPrice: item.variant.price, quantity: item.quantity, lineTotal: new Prisma.Decimal(item.variant.price).mul(item.quantity) })) }, address: { create: { recipient: input.customer.fullName, phone: input.customer.phone, address: input.customer.address, city: input.customer.city, region: input.customer.region, postalCode: input.customer.postalCode, notes: input.customer.notes || null } } }, select: { id: true, orderNumber: true, status: true, currency: true, subtotal: true, shippingAmount: true, discountAmount: true, total: true, createdAt: true } });
    await reserveInventory(transaction, cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })), order.id);
    await transaction.payment.create({ data: { orderId: order.id, method: "CASH_ON_DELIVERY", status: "PENDING", amount: total, currency } });
    if (couponId) await transaction.couponUsage.create({ data: { couponId, orderId: order.id } });
    await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { ...order, subtotal: Number(order.subtotal), shippingAmount: Number(order.shippingAmount), discountAmount: Number(order.discountAmount), total: Number(order.total) };
  }, { maxWait: 5_000, timeout: 9_000 });
}

export async function getOrderStatus(orderNumber: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { orderNumber: true, status: true, createdAt: true, currency: true, total: true } });
  if (!order) throw new AppError(404, "Order not found.", "ORDER_NOT_FOUND");
  return { ...order, total: Number(order.total) };
}
