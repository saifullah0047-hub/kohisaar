import { config as loadEnvFile } from "dotenv";
import { z } from "zod";

loadEnvFile({ path: ".env.local" });
loadEnvFile();

const optionalSetting = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z.string().min(1),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  SHIPPING_FLAT_AMOUNT: z.coerce.number().min(0).optional(),
  PAYMENT_PROVIDER: optionalSetting,
  PAYMENT_API_KEY: optionalSetting,
  PAYMENT_WEBHOOK_SECRET: optionalSetting,
  META_PIXEL_ID: optionalSetting,
  META_ACCESS_TOKEN: optionalSetting,
  META_CONVERSIONS_API_ACCESS_TOKEN: optionalSetting,
  META_TEST_EVENT_CODE: optionalSetting,
  AUTH_JWT_SECRET: z.string().min(32).optional(),
  AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid server environment", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
};
