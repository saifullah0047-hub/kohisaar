import { Router } from "express";
import { prisma } from "../../common/database/prisma.js";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { requireAuthentication, requireRole, type AuthenticatedRequest } from "../../common/middleware/auth.js";
import { validateBody } from "../../common/middleware/validate.js";
import { z } from "zod";

const sectionSchema = z.object({
  key: z.string().trim().min(1).max(100),
  eyebrow: z.string().trim().max(200).optional().nullable(),
  title: z.string().trim().max(300).optional().nullable(),
  body: z.string().trim().max(10000).optional().nullable(),
  imageSrc: z.string().trim().min(1).max(1000).optional().nullable(),
  imageAlt: z.string().trim().max(300).optional().nullable(),
  ctaLabel: z.string().trim().max(100).optional().nullable(),
  ctaHref: z.string().trim().max(300).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

const settingSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.record(z.string(), z.unknown()),
});

const articleSchema = z.object({
  slug: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(300),
  excerpt: z.string().trim().max(1000).optional().nullable(),
  body: z.string().trim().min(1),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
});

const faqSchema = z.object({
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(5000),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

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

export const contentRouter = Router();

contentRouter.get(
  "/homepage",
  asyncHandler(async (_request, response) => {
    const data = await prisma.homepageSection.findMany({
      where: { isPublished: true },
      select: {
        key: true,
        eyebrow: true,
        title: true,
        body: true,
        imageSrc: true,
        imageAlt: true,
        ctaLabel: true,
        ctaHref: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: "asc" },
    });
    response.json({ data });
  }),
);

contentRouter.get(
  "/settings/seo",
  asyncHandler(async (_request, response) => {
    const data = await prisma.siteSetting.findMany({
      where: { key: { in: ["seo.title", "seo.description", "seo.socialImage"] } },
      select: { key: true, value: true },
    });
    response.json({ data });
  }),
);

contentRouter.get(
  "/articles",
  asyncHandler(async (_request, response) => {
    const data = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, title: true, excerpt: true, body: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    response.json({ data });
  }),
);

contentRouter.get(
  "/articles/:slug",
  asyncHandler(async (request, response) => {
    const article = await prisma.article.findFirst({
      where: { slug: String(request.params.slug), status: "PUBLISHED" },
      select: { slug: true, title: true, excerpt: true, body: true, publishedAt: true, updatedAt: true },
    });
    if (!article) return response.status(404).json({ error: { code: "ARTICLE_NOT_FOUND", message: "Article not found" } });
    return response.json({ data: article });
  }),
);

contentRouter.get(
  "/faqs",
  asyncHandler(async (_request, response) => {
    const data = await prisma.fAQ.findMany({
      where: { isActive: true },
      select: { id: true, question: true, answer: true },
      orderBy: { sortOrder: "asc" },
    });
    response.json({ data });
  }),
);

export const adminContentRouter = Router();
adminContentRouter.use(requireAuthentication, requireRole("admin"));

adminContentRouter.get(
  "/homepage",
  asyncHandler(async (_request, response) => {
    const data = await prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } });
    response.json({ data });
  }),
);

adminContentRouter.put(
  "/homepage/:key",
  validateBody(sectionSchema.omit({ key: true })),
  asyncHandler(async (request, response) => {
    const key = String(request.params.key);
    const section = await prisma.homepageSection.upsert({
      where: { key },
      create: { key, ...request.body },
      update: request.body,
    });
    await audit(request as AuthenticatedRequest, "HOMEPAGE_SECTION_UPDATED", "HomepageSection", section.id);
    response.json({ data: section });
  }),
);

adminContentRouter.get(
  "/articles",
  asyncHandler(async (_request, response) => {
    const data = await prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
    response.json({ data });
  }),
);

adminContentRouter.post(
  "/articles",
  validateBody(articleSchema),
  asyncHandler(async (request, response) => {
    const payload = { ...request.body };
    if (payload.status === "PUBLISHED" && !payload.publishedAt) {
      payload.publishedAt = new Date();
    }
    const article = await prisma.article.create({ data: payload });
    await audit(request as AuthenticatedRequest, "ARTICLE_CREATED", "Article", article.id);
    response.status(201).json({ data: article });
  }),
);

adminContentRouter.patch(
  "/articles/:id",
  validateBody(articleSchema.partial()),
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const payload = { ...request.body };
    if (payload.status === "PUBLISHED" && !payload.publishedAt) {
      payload.publishedAt = new Date();
    }
    const article = await prisma.article.update({
      where: { id },
      data: payload,
    });
    await audit(request as AuthenticatedRequest, "ARTICLE_UPDATED", "Article", article.id);
    response.json({ data: article });
  }),
);

adminContentRouter.delete(
  "/articles/:id",
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    await prisma.article.delete({ where: { id } });
    await audit(request as AuthenticatedRequest, "ARTICLE_DELETED", "Article", id);
    response.json({ data: { success: true, id } });
  }),
);

adminContentRouter.get(
  "/faqs",
  asyncHandler(async (_request, response) => {
    const data = await prisma.fAQ.findMany({ orderBy: { sortOrder: "asc" } });
    response.json({ data });
  }),
);

adminContentRouter.post(
  "/faqs",
  validateBody(faqSchema),
  asyncHandler(async (request, response) => {
    const faq = await prisma.fAQ.create({ data: request.body });
    await audit(request as AuthenticatedRequest, "FAQ_CREATED", "FAQ", faq.id);
    response.status(201).json({ data: faq });
  }),
);

adminContentRouter.patch(
  "/faqs/:id",
  validateBody(faqSchema.partial()),
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const faq = await prisma.fAQ.update({
      where: { id },
      data: request.body,
    });
    await audit(request as AuthenticatedRequest, "FAQ_UPDATED", "FAQ", faq.id);
    response.json({ data: faq });
  }),
);

adminContentRouter.delete(
  "/faqs/:id",
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    await prisma.fAQ.delete({ where: { id } });
    await audit(request as AuthenticatedRequest, "FAQ_DELETED", "FAQ", id);
    response.json({ data: { success: true, id } });
  }),
);

adminContentRouter.get(
  "/settings",
  asyncHandler(async (_request, response) => {
    const data = await prisma.siteSetting.findMany();
    response.json({ data });
  }),
);

adminContentRouter.put(
  "/settings/:key",
  validateBody(settingSchema),
  asyncHandler(async (request, response) => {
    const key = String(request.params.key);
    const setting = await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: request.body.value },
      update: { value: request.body.value },
    });
    await audit(request as AuthenticatedRequest, "SETTING_UPDATED", "SiteSetting", setting.id);
    response.json({ data: setting });
  }),
);
