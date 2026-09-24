import { Router } from "express";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { validateBody } from "../../common/middleware/validate.js";
import { createOnlinePayment, handleWebhook, cancelOnlinePayment } from "./payment.service.js";
import { paymentIdempotencySchema, paymentOrderParamsSchema, paymentProviderParamsSchema } from "./payment.schemas.js";

export const paymentRouter = Router();
paymentRouter.post("/orders/:orderNumber", validateBody(paymentIdempotencySchema), asyncHandler(async (request, response) => {
  const { orderNumber } = paymentOrderParamsSchema.parse(request.params);
  const payment = await createOnlinePayment(orderNumber, request.body.idempotencyKey as string);
  response.status(payment.reused ? 200 : 201).json({ data: payment });
}));
paymentRouter.post("/orders/:orderNumber/cancel", asyncHandler(async (request, response) => {
  const { orderNumber } = paymentOrderParamsSchema.parse(request.params);
  await cancelOnlinePayment(orderNumber);
  response.status(204).send();
}));

export const paymentWebhookRouter = Router();
paymentWebhookRouter.post("/:provider", asyncHandler(async (request, response) => {
  const { provider } = paymentProviderParamsSchema.parse(request.params);
  const rawBody = Buffer.isBuffer(request.body) ? request.body : Buffer.from(JSON.stringify(request.body));
  const result = await handleWebhook(provider, rawBody, request.header("x-payment-signature"));
  response.status(200).json({ received: true, ...result });
}));
