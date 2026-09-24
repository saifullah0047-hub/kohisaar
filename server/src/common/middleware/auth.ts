import jwt from "jsonwebtoken";
import type { NextFunction, Response } from "express";
import type { Request } from "express";
import { prisma } from "../database/prisma.js";
import { AppError } from "../errors/AppError.js";
import { env } from "../../config/env.js";

export const ADMIN_SESSION_COOKIE = "kohi_saar_admin_session";
export interface AuthenticatedRequest extends Request { user?: { id: string; roles: string[] }; }

function tokenFrom(request: Request) {
  const authorization = request.header("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  const cookie = request.header("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  return cookie?.slice(`${ADMIN_SESSION_COOKIE}=`.length);
}

export async function requireAuthentication(request: AuthenticatedRequest, _response: Response, next: NextFunction) {
  if (!env.AUTH_JWT_SECRET) return next(new AppError(503, "Authentication is not configured.", "AUTH_NOT_CONFIGURED"));
  const token = tokenFrom(request);
  if (!token) return next(new AppError(401, "Authentication required.", "UNAUTHENTICATED"));
  try {
    const payload = jwt.verify(token, env.AUTH_JWT_SECRET);
    if (typeof payload === "string" || !payload.sub) throw new Error("Invalid session");
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: { select: { name: true } } } });
    if (!user) throw new Error("Unknown session");
    request.user = { id: user.id, roles: [user.role.name] };
    next();
  } catch { next(new AppError(401, "Invalid or expired session.", "UNAUTHENTICATED")); }
}

export function requireRole(role: string) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    if (!request.user?.roles.includes(role)) return next(new AppError(403, "Insufficient permissions.", "FORBIDDEN"));
    next();
  };
}
