import { Router } from "express";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { validateBody } from "../../common/middleware/validate.js";
import { createOrderSchema, orderNumberParamsSchema, publicOrderNumberParamsSchema } from "./order.schemas.js";
import { createOrder, getOrderStatus } from "./order.service.js";
import { transitionOrder } from "./order.transitions.js";
import { OrderStatus } from "@prisma/client";
import { requireAuthentication, requireRole, type AuthenticatedRequest } from "../../common/middleware/auth.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { Request } from "express";
import { waitUntil } from "@vercel/functions";
import { sendMetaConversionEvent } from "../meta/meta-conversions-api.service.js";

export const orderRouter = Router();

function requestCookie(request: Request, name: string) {
  const cookieHeader = request.header("cookie");
  if (!cookieHeader) return undefined;
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return cookie?.slice(name.length + 1) || undefined;
}

function clientIpAddress(request: Request) {
  const candidates = [request.ip, request.header("x-real-ip"), request.socket.remoteAddress];
  return candidates.find((value) => value && isIP(value.trim()));
}

function eventSourceUrl(request: Request) {
  const referer = request.header("referer");
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

orderRouter.post("/", validateBody(createOrderSchema), asyncHandler(async (request, response) => {
  const order = await createOrder(request.header("x-cart-session")?.trim(), request.body);

  if (request.header("x-analytics-consent") === "granted") {
    const customer = (request.body as { customer: { email: string; phone: string } }).customer;
    const headerEventId = request.header("x-meta-event-id")?.trim();
    const eventId = headerEventId && /^[A-Za-z0-9._:-]{1,128}$/.test(headerEventId) ? headerEventId : randomUUID();
    const conversionTask = sendMetaConversionEvent({
      eventName: "Purchase",
      eventId,
      actionSource: "website",
      eventSourceUrl: eventSourceUrl(request),
      userData: {
        email: customer.email,
        phone: customer.phone,
        clientIpAddress: clientIpAddress(request),
        clientUserAgent: request.header("user-agent"),
        fbp: requestCookie(request, "_fbp"),
        fbc: requestCookie(request, "_fbc"),
      },
      customData: {
        currency: order.currency,
        value: order.total,
        order_id: order.orderNumber,
      },
    }).catch((error: unknown) => {
      console.error("[Meta CAPI] Failed to prepare Purchase event.", error instanceof Error ? error.message : "unknown error");
      return false;
    });

    if (process.env.VERCEL) {
      try {
        waitUntil(conversionTask);
      } catch {
        void conversionTask;
      }
    } else {
      void conversionTask;
    }
  }

  response.status(201).json({ data: order });
}));
orderRouter.get("/:orderNumber", asyncHandler(async (request, response) => {
  const { orderNumber } = publicOrderNumberParamsSchema.parse(request.params);
  response.json({ data: await getOrderStatus(orderNumber) });
}));
orderRouter.patch("/:orderNumber/status", requireAuthentication, requireRole("admin"), validateBody(z.object({ status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]) })), asyncHandler(async (request, response) => {
  const { orderNumber } = orderNumberParamsSchema.parse(request.params);
  const userId = (request as AuthenticatedRequest).user?.id;
  response.json({ data: await transitionOrder(orderNumber, (request.body as { status: OrderStatus }).status, userId) });
}));
