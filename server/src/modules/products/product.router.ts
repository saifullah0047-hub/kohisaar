import { Prisma, ProductAvailability } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { requireAuthentication, requireRole, type AuthenticatedRequest } from "../../common/middleware/auth.js";
import { validateBody } from "../../common/middleware/validate.js";
import { publicProductSelect, toPublicProduct } from "./product.mapper.js";
import { imageWriteSchema, inventoryWriteSchema, productIdParamsSchema, productQuerySchema, productSlugParamsSchema, productWriteSchema, variantWriteSchema } from "./product.schemas.js";

export const productRouter = Router();

productRouter.get("/", asyncHandler(async (request, response) => {
  const query = productQuerySchema.parse(request.query);
  const where = {
    availability: { in: [ProductAvailability.AVAILABLE, ProductAvailability.PREORDER] },
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" as const } }, { shortDescription: { contains: query.search, mode: "insensitive" as const } }] } : {}),
  } satisfies Prisma.ProductWhereInput;
  const orderBy = query.sort === "name" ? { name: "asc" as const } : { createdAt: "desc" as const };
  const requiresPriceSort = query.sort === "price-asc" || query.sort === "price-desc";
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, select: publicProductSelect, orderBy, ...(requiresPriceSort ? {} : { skip: (query.page - 1) * query.limit, take: query.limit }) }),
    prisma.product.count({ where }),
  ]);
  const products = items.map(toPublicProduct);
  if (query.sort === "price-asc") products.sort((left, right) => (left.price ?? Number.MAX_SAFE_INTEGER) - (right.price ?? Number.MAX_SAFE_INTEGER));
  if (query.sort === "price-desc") products.sort((left, right) => (right.price ?? 0) - (left.price ?? 0));
  const pagedProducts = requiresPriceSort ? products.slice((query.page - 1) * query.limit, query.page * query.limit) : products;
  response.json({ data: pagedProducts, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
}));

productRouter.get("/featured", asyncHandler(async (_request, response) => {
  const products = await prisma.product.findMany({ where: { featured: true, availability: { in: [ProductAvailability.AVAILABLE, ProductAvailability.PREORDER] } }, select: publicProductSelect, orderBy: { createdAt: "desc" }, take: 12 });
  response.json({ data: products.map(toPublicProduct) });
}));

productRouter.get("/id/:id", asyncHandler(async (request, response) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const product = await prisma.product.findFirst({ where: { id, availability: { in: [ProductAvailability.AVAILABLE, ProductAvailability.PREORDER] } }, select: publicProductSelect });
  if (!product) throw new AppError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  response.json({ data: toPublicProduct(product) });
}));

productRouter.get("/slug/:slug", asyncHandler(async (request, response) => {
  const { slug } = productSlugParamsSchema.parse(request.params);
  const product = await prisma.product.findFirst({ where: { slug, availability: { in: [ProductAvailability.AVAILABLE, ProductAvailability.PREORDER] } }, select: publicProductSelect });
  if (!product) throw new AppError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  response.json({ data: toPublicProduct(product) });
}));

async function audit(request: AuthenticatedRequest, action: string, entity: string, entityId: string) {
  if (request.user?.id) await prisma.auditLog.create({ data: { userId: request.user.id, action, entity, entityId } });
}

productRouter.post("/", requireAuthentication, requireRole("admin"), validateBody(productWriteSchema), asyncHandler(async (request, response) => {
  const {
    categoryId,
    slug,
    name,
    shortDescription,
    description,
    availability = ProductAvailability.AVAILABLE,
    featured = false,
    price,
    compareAtPrice,
    currency = "PKR",
    stockQuantity = 0,
    lowStockThreshold = 0,
    variantName = "Standard",
    sku,
    imageSrc,
    imageAlt,
  } = request.body;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        categoryId,
        slug,
        name,
        shortDescription,
        description,
        availability,
        featured,
      },
    });

    if (price !== undefined) {
      await tx.productVariant.create({
        data: {
          productId: product.id,
          name: variantName || "Standard",
          sku: sku || `${product.slug}-default`,
          price,
          compareAtPrice: compareAtPrice ?? null,
          currency: currency || "PKR",
          stockQuantity: stockQuantity ?? 0,
          lowStockThreshold: lowStockThreshold ?? 0,
        },
      });
    }

    if (imageSrc) {
      await tx.productImage.create({
        data: {
          productId: product.id,
          src: imageSrc,
          alt: imageAlt || product.name,
          sortOrder: 0,
        },
      });
    }

    return product;
  });

  await audit(request as AuthenticatedRequest, "PRODUCT_CREATED", "Product", result.id);
  response.status(201).json({ data: { id: result.id, slug: result.slug } });
}));

productRouter.patch("/:id", requireAuthentication, requireRole("admin"), validateBody(productWriteSchema.partial()), asyncHandler(async (request, response) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const {
    price,
    compareAtPrice,
    currency,
    stockQuantity,
    lowStockThreshold,
    variantName,
    sku,
    imageSrc,
    imageAlt,
    ...productData
  } = request.body;

  const product = await prisma.$transaction(async (tx) => {
    const updatedProduct = Object.keys(productData).length > 0
      ? await tx.product.update({ where: { id }, data: productData })
      : await tx.product.findUniqueOrThrow({ where: { id } });

    if (price !== undefined || compareAtPrice !== undefined || stockQuantity !== undefined || currency !== undefined) {
      const firstVariant = await tx.productVariant.findFirst({ where: { productId: id }, orderBy: { createdAt: "asc" } });
      if (firstVariant) {
        await tx.productVariant.update({
          where: { id: firstVariant.id },
          data: {
            ...(price !== undefined ? { price } : {}),
            ...(compareAtPrice !== undefined ? { compareAtPrice: compareAtPrice ?? null } : {}),
            ...(stockQuantity !== undefined ? { stockQuantity } : {}),
            ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
            ...(currency !== undefined ? { currency } : {}),
            ...(variantName !== undefined ? { name: variantName } : {}),
            ...(sku !== undefined ? { sku } : {}),
          },
        });
      } else if (price !== undefined) {
        await tx.productVariant.create({
          data: {
            productId: id,
            name: variantName || "Standard",
            sku: sku || `${updatedProduct.slug}-default`,
            price,
            compareAtPrice: compareAtPrice ?? null,
            currency: currency || "PKR",
            stockQuantity: stockQuantity ?? 0,
            lowStockThreshold: lowStockThreshold ?? 0,
          },
        });
      }
    }

    if (imageSrc !== undefined) {
      const firstImage = await tx.productImage.findFirst({ where: { productId: id }, orderBy: { sortOrder: "asc" } });
      if (firstImage) {
        await tx.productImage.update({
          where: { id: firstImage.id },
          data: { src: imageSrc, ...(imageAlt ? { alt: imageAlt } : {}) },
        });
      } else if (imageSrc) {
        await tx.productImage.create({
          data: { productId: id, src: imageSrc, alt: imageAlt || updatedProduct.name, sortOrder: 0 },
        });
      }
    }

    return updatedProduct;
  });

  await audit(request as AuthenticatedRequest, "PRODUCT_UPDATED", "Product", product.id);
  response.json({ data: { id: product.id, slug: product.slug } });
}));

productRouter.delete("/:id", requireAuthentication, requireRole("admin"), asyncHandler(async (request, response) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const product = await prisma.product.update({ where: { id }, data: { availability: "UNAVAILABLE", featured: false } });
  await audit(request as AuthenticatedRequest, "PRODUCT_DEACTIVATED", "Product", product.id);
  response.status(204).send();
}));

productRouter.post("/:id/variants", requireAuthentication, requireRole("admin"), validateBody(variantWriteSchema), asyncHandler(async (request, response) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const { name, sku, price, compareAtPrice, currency, stockQuantity, inventoryQuantity, lowStockThreshold } = request.body;
  const variant = await prisma.productVariant.create({
    data: {
      productId: id,
      name,
      sku,
      price,
      compareAtPrice: compareAtPrice ?? null,
      currency,
      stockQuantity: stockQuantity ?? inventoryQuantity ?? 0,
      lowStockThreshold: lowStockThreshold ?? 0,
    },
  });
  await audit(request as AuthenticatedRequest, "PRODUCT_VARIANT_CREATED", "ProductVariant", variant.id);
  response.status(201).json({ data: { id: variant.id, name: variant.name } });
}));

productRouter.patch("/:id/variants/:variantId", requireAuthentication, requireRole("admin"), validateBody(variantWriteSchema.partial()), asyncHandler(async (request, response) => {
  const { id, variantId } = productIdParamsSchema.extend({ variantId: productIdParamsSchema.shape.id }).parse(request.params);
  const existing = await prisma.productVariant.findFirst({ where: { id: variantId, productId: id }, select: { id: true } });
  if (!existing) throw new AppError(404, "Product variant not found.", "VARIANT_NOT_FOUND");
  const { inventoryQuantity, stockQuantity, compareAtPrice, ...rest } = request.body;
  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...rest,
      ...(stockQuantity !== undefined ? { stockQuantity } : inventoryQuantity !== undefined ? { stockQuantity: inventoryQuantity } : {}),
      ...(compareAtPrice !== undefined ? { compareAtPrice: compareAtPrice ?? null } : {}),
    },
  });
  await audit(request as AuthenticatedRequest, "PRODUCT_VARIANT_UPDATED", "ProductVariant", variant.id);
  response.json({ data: { id: variant.id, name: variant.name } });
}));

productRouter.post("/:id/images", requireAuthentication, requireRole("admin"), validateBody(imageWriteSchema), asyncHandler(async (request, response) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const image = await prisma.productImage.create({ data: { productId: id, ...request.body } });
  await audit(request as AuthenticatedRequest, "PRODUCT_IMAGE_CREATED", "ProductImage", image.id);
  response.status(201).json({ data: { id: image.id, src: image.src } });
}));

productRouter.patch("/:id/inventory", requireAuthentication, requireRole("admin"), validateBody(inventoryWriteSchema), asyncHandler(async (request, response) => {
  const { id } = productIdParamsSchema.parse(request.params);
  const qty = request.body.stockQuantity ?? request.body.inventoryQuantity ?? 0;
  const variant = await prisma.productVariant.update({ where: { id }, data: { stockQuantity: qty } });
  await audit(request as AuthenticatedRequest, "PRODUCT_INVENTORY_UPDATED", "ProductVariant", variant.id);
  response.json({ data: { id: variant.id, stockQuantity: variant.stockQuantity, reservedQuantity: variant.reservedQuantity, lowStockThreshold: variant.lowStockThreshold } });
}));
