import { Router } from "express";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { validateBody } from "../../common/middleware/validate.js";
import { createOrderSchema, orderNumberParamsSchema } from "./order.schemas.js";
import { createOrder, getOrderStatus } from "./order.service.js";
import { transitionOrder } from "./order.transitions.js";
import { OrderStatus } from "@prisma/client";
import { requireAuthentication, requireRole, type AuthenticatedRequest } from "../../common/middleware/auth.js";
import { z } from "zod";

export const orderRouter = Router();
orderRouter.post("/", validateBody(createOrderSchema), asyncHandler(async (request, response) => {
  const order = await createOrder(request.header("x-cart-session")?.trim(), request.body);
  response.status(201).json({ data: order });
}));
orderRouter.get("/:orderNumber", asyncHandler(async (request, response) => {
  const { orderNumber } = orderNumberParamsSchema.parse(request.params);
  response.json({ data: await getOrderStatus(orderNumber) });
}));
orderRouter.patch("/:orderNumber/status", requireAuthentication, requireRole("admin"), validateBody(z.object({ status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]) })), asyncHandler(async (request, response) => {
  const { orderNumber } = orderNumberParamsSchema.parse(request.params);
  const userId = (request as AuthenticatedRequest).user?.id;
  response.json({ data: await transitionOrder(orderNumber, (request.body as { status: OrderStatus }).status, userId) });
}));
