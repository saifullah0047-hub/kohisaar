import { Router } from "express";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { requireAuthentication, requireRole, type AuthenticatedRequest } from "../../common/middleware/auth.js";
import { validateBody } from "../../common/middleware/validate.js";
import { reviewCreateSchema, reviewParamsSchema, reviewProductParamsSchema, reviewStatusSchema } from "./review.schemas.js";

export const reviewRouter = Router();
reviewRouter.get("/", asyncHandler(async (_request, response) => {
  const reviews = await prisma.review.findMany({ where: { status: "APPROVED" }, select: { id: true, productId: true, rating: true, title: true, body: true, createdAt: true, user: { select: { fullName: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  response.json({ data: reviews.map((review) => ({ id: review.id, productId: review.productId, quote: review.body, author: review.user?.fullName ?? "Verified customer", rating: review.rating, title: review.title, createdAt: review.createdAt })) });
}));
reviewRouter.get("/products/:productId", asyncHandler(async (request, response) => {
  const { productId } = reviewProductParamsSchema.parse(request.params);
  const reviews = await prisma.review.findMany({ where: { productId, status: "APPROVED" }, select: { id: true, rating: true, title: true, body: true, createdAt: true, user: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } });
  response.json({ data: reviews.map((review) => ({ ...review, author: review.user?.fullName ?? "Verified customer", user: undefined })) });
}));
reviewRouter.post("/products/:productId", validateBody(reviewCreateSchema), asyncHandler(async (request, response) => {
  const { productId } = reviewProductParamsSchema.parse(request.params);
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw new AppError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  const userId = (request as AuthenticatedRequest).user?.id;
  const review = await prisma.review.create({ data: { productId, userId, ...request.body }, select: { id: true, status: true, createdAt: true } });
  response.status(201).json({ data: { id: review.id, status: review.status, message: "Your review was submitted for moderation." } });
}));

export const adminReviewRouter = Router();
adminReviewRouter.use(requireAuthentication, requireRole("admin"));
adminReviewRouter.get("/", asyncHandler(async (_request, response) => {
  const reviews = await prisma.review.findMany({ select: { id: true, productId: true, rating: true, title: true, body: true, status: true, createdAt: true, product: { select: { name: true, slug: true } }, user: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: "desc" } });
  response.json({ data: reviews });
}));
adminReviewRouter.patch("/:id/status", validateBody(reviewStatusSchema), asyncHandler(async (request, response) => {
  const { id } = reviewParamsSchema.parse(request.params);
  const review = await prisma.review.update({ where: { id }, data: { status: request.body.status }, select: { id: true, status: true, productId: true } });
  const userId = (request as AuthenticatedRequest).user?.id;
  if (userId) await prisma.auditLog.create({ data: { userId, action: `REVIEW_${review.status}`, entity: "Review", entityId: review.id } });
  response.json({ data: review });
}));
