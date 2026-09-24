import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { env } from "../../config/env.js";
import { paymentProviders } from "./payment.provider.js";

export async function createOnlinePayment(orderNumber: string, idempotencyKey: string) {
  const existing = await prisma.payment.findUnique({ where: { idempotencyKey }, select: { id: true, providerReference: true, status: true, amount: true, currency: true } });
  if (existing) return { ...existing, amount: Number(existing.amount), reused: true };
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true, email: true, total: true, currency: true, payments: { select: { method: true } } } });
  if (!order) throw new AppError(404, "Order not found.", "ORDER_NOT_FOUND");
  if (order.payments.some((payment) => payment.method === PaymentMethod.CASH_ON_DELIVERY)) throw new AppError(409, "This order uses Cash on Delivery.", "PAYMENT_METHOD_MISMATCH");
  const providerName = env.PAYMENT_PROVIDER;
  const provider = providerName ? paymentProviders.get(providerName) : undefined;
  if (!provider || !env.PAYMENT_API_KEY) throw new AppError(501, "Online payment is not configured for the target market.", "PAYMENT_NOT_CONFIGURED");
  const result = await provider.createPayment({ orderNumber, amount: Number(order.total), currency: order.currency, idempotencyKey, customerEmail: order.email });
  const payment = await prisma.payment.create({ data: { orderId: order.id, method: PaymentMethod.ONLINE, status: result.status, provider: provider.name, providerReference: result.providerReference, idempotencyKey, amount: order.total, currency: order.currency }, select: { id: true, providerReference: true, status: true, amount: true, currency: true } });
  return { ...payment, amount: Number(payment.amount), redirectUrl: result.redirectUrl, reused: false };
}

export function handleWebhook(providerName: string, rawBody: Buffer, signature: string | undefined) {
  const provider = paymentProviders.get(providerName);
  if (!provider || !env.PAYMENT_WEBHOOK_SECRET) throw new AppError(501, "Payment webhook provider is not configured.", "PAYMENT_NOT_CONFIGURED");
  const event = provider.verifyWebhook(rawBody, signature);
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.paymentWebhookEvent.findUnique({ where: { provider_eventId: { provider: provider.name, eventId: event.eventId } } });
    if (existing) return { duplicate: true };
    const payment = await transaction.payment.findFirst({ where: { provider: provider.name, providerReference: event.providerReference }, select: { id: true } });
    if (!payment) throw new AppError(404, "Payment not found.", "PAYMENT_NOT_FOUND");
    await transaction.payment.update({ where: { id: payment.id }, data: { status: event.status } });
    await transaction.paymentWebhookEvent.create({ data: { provider: provider.name, eventId: event.eventId, payloadHash: event.payloadHash } });
    return { duplicate: false };
  });
}

export async function cancelOnlinePayment(orderNumber: string) {
  const payment = await prisma.payment.findFirst({ where: { order: { orderNumber }, method: PaymentMethod.ONLINE, status: { in: [PaymentStatus.PENDING, PaymentStatus.AUTHORIZED] } }, select: { id: true, provider: true, providerReference: true } });
  if (!payment) throw new AppError(404, "Cancellable payment not found.", "PAYMENT_NOT_FOUND");
  const provider = payment.provider ? paymentProviders.get(payment.provider) : undefined;
  if (!provider || !payment.providerReference) throw new AppError(501, "Payment cancellation is not configured.", "PAYMENT_NOT_CONFIGURED");
  await provider.cancelPayment(payment.providerReference);
  await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.CANCELLED } });
}
