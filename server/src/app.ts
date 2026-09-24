import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { errorHandler } from "./common/middleware/errorHandler.js";
import { notFound } from "./common/middleware/notFound.js";
import { healthRouter } from "./modules/health/health.router.js";
import { categoryRouter } from "./modules/categories/category.router.js";
import { productRouter } from "./modules/products/product.router.js";
import { cartRouter } from "./modules/cart/cart.router.js";
import { orderRouter } from "./modules/orders/order.router.js";
import { paymentRouter, paymentWebhookRouter } from "./modules/payments/payment.router.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";
import { reviewRouter, adminReviewRouter } from "./modules/reviews/review.router.js";
import { contentRouter, adminContentRouter } from "./modules/content/content.router.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX, standardHeaders: "draft-8", legacyHeaders: false }));
  app.use(pinoHttp({ level: env.LOG_LEVEL }));
  app.use("/api/v1/payments/webhooks", express.raw({ type: "application/json", limit: "256kb" }), paymentWebhookRouter);
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "50kb" }));

  app.get("/api/v1/health", (_request, response) => response.json({ status: "ok" }));
  app.use("/api/v1/health/", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/products", productRouter);
  app.use("/api/v1/categories", categoryRouter);
  app.use("/api/v1/cart", cartRouter);
  app.use("/api/v1/orders", orderRouter);
  app.use("/api/v1/payments", paymentRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/reviews", reviewRouter);
  app.use("/api/v1/content", contentRouter);
  app.use("/api/v1/admin/reviews", adminReviewRouter);
  app.use("/api/v1/admin/content", adminContentRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
