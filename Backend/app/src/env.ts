export type AppEnv = {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  ALLOWED_ORIGINS: string[];
};

const required = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const loadEnv = (): AppEnv => {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as AppEnv["NODE_ENV"];
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  const jwtSecret = required("JWT_SECRET", nodeEnv === "production" ? undefined : "development-only-secret-at-least-32-chars");
  if (jwtSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");

  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT is invalid");

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: required("DATABASE_URL", "postgresql://nextech:nextech@localhost:55432/nextech"),
    JWT_SECRET: jwtSecret,
    JWT_ISSUER: process.env.JWT_ISSUER ?? "nextech-api",
    JWT_AUDIENCE: process.env.JWT_AUDIENCE ?? "nextech-web",
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
};

export const env = loadEnv();
