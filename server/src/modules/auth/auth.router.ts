import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Router } from "express";
import { prisma } from "../../common/database/prisma.js";
import { AppError } from "../../common/errors/AppError.js";
import { asyncHandler } from "../../common/http/asyncHandler.js";
import { ADMIN_SESSION_COOKIE, requireAuthentication, type AuthenticatedRequest } from "../../common/middleware/auth.js";
import { validateBody } from "../../common/middleware/validate.js";
import { env } from "../../config/env.js";
import { adminLoginSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/admin/login", validateBody(adminLoginSchema), asyncHandler(async (request, response) => {
  if (!env.AUTH_JWT_SECRET) throw new AppError(503, "Authentication is not configured.", "AUTH_NOT_CONFIGURED");
  const { email, password } = request.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, fullName: true, email: true, passwordHash: true, role: { select: { name: true } } } });
  if (!user || user.role.name !== "admin" || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
  const token = jwt.sign({ sub: user.id }, env.AUTH_JWT_SECRET, { expiresIn: env.AUTH_SESSION_TTL_SECONDS });
  const isProduction = env.NODE_ENV === "production";
  response.cookie(ADMIN_SESSION_COOKIE, token, { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax", maxAge: env.AUTH_SESSION_TTL_SECONDS * 1000, path: "/" });
  await prisma.auditLog.create({ data: { userId: user.id, action: "ADMIN_LOGIN", entity: "User", entityId: user.id } });
  response.json({ data: { id: user.id, fullName: user.fullName, email: user.email, role: user.role.name } });
}));

authRouter.post("/logout", requireAuthentication, asyncHandler(async (request, response) => {
  const authenticatedRequest = request as AuthenticatedRequest;
  const isProduction = env.NODE_ENV === "production";
  response.clearCookie(ADMIN_SESSION_COOKIE, { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax", path: "/" });
  await prisma.auditLog.create({ data: { userId: authenticatedRequest.user?.id, action: "ADMIN_LOGOUT", entity: "User", entityId: authenticatedRequest.user?.id } });
  response.status(204).send();
}));

authRouter.get("/admin/session", requireAuthentication, (request, response) => { const authenticatedRequest = request as AuthenticatedRequest; response.json({ data: { id: authenticatedRequest.user?.id, roles: authenticatedRequest.user?.roles } }); });
