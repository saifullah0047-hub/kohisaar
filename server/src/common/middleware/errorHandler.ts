import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) return next(error);
  const appError = error instanceof AppError ? error : error instanceof ZodError ? new AppError(400, "Request validation failed.", "VALIDATION_ERROR") : new AppError(500, "An unexpected error occurred.", "INTERNAL_ERROR");
  response.status(appError.statusCode).json({ error: { code: appError.code, message: appError.message } });
};
