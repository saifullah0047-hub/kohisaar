import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { requireAuthentication, requireRole, type AuthenticatedRequest } from "../../common/middleware/auth.js";
import { validateBody } from "../../common/middleware/validate.js";

const categoryWriteSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120),
});

const categoryUpdateSchema = categoryWriteSchema.partial();

async function audit(request: AuthenticatedRequest, action: string, entity: string, entityId: string) {
  if (request.user?.id) {
    await prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action,
        entity,
        entityId,
      },
    });
  }
}

export const categoryRouter = Router();

categoryRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });
    response.json({ data: categories });
  }),
);

categoryRouter.post(
  "/",
  requireAuthentication,
  requireRole("admin"),
  validateBody(categoryWriteSchema),
  asyncHandler(async (request, response) => {
    const { name, slug } = request.body;
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new AppError(409, "Category with this slug already exists.", "CATEGORY_SLUG_CONFLICT");
    }

    const category = await prisma.category.create({
      data: { name, slug },
    });

    await audit(request as AuthenticatedRequest, "CATEGORY_CREATED", "Category", category.id);
    response.status(201).json({ data: category });
  }),
);

categoryRouter.patch(
  "/:id",
  requireAuthentication,
  requireRole("admin"),
  validateBody(categoryUpdateSchema),
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, "Category not found.", "CATEGORY_NOT_FOUND");
    }

    if (request.body.slug && request.body.slug !== existing.slug) {
      const slugTaken = await prisma.category.findUnique({ where: { slug: request.body.slug } });
      if (slugTaken) {
        throw new AppError(409, "Category with this slug already exists.", "CATEGORY_SLUG_CONFLICT");
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: request.body,
    });

    await audit(request as AuthenticatedRequest, "CATEGORY_UPDATED", "Category", category.id);
    response.json({ data: category });
  }),
);

categoryRouter.delete(
  "/:id",
  requireAuthentication,
  requireRole("admin"),
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, "Category not found.", "CATEGORY_NOT_FOUND");
    }

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new AppError(
        400,
        `Cannot delete category "${existing.name}" because it contains ${productCount} product(s). Reassign or remove the products first.`,
        "CATEGORY_IN_USE",
      );
    }

    await prisma.category.delete({ where: { id } });
    await audit(request as AuthenticatedRequest, "CATEGORY_DELETED", "Category", id);
    response.json({ data: { success: true, id } });
  }),
);
