import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/AppError.js";

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);
    if (!result.success) return next(new AppError(400, "Request validation failed.", "VALIDATION_ERROR"));
    request.body = result.data;
    next();
  };
}
