import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { env } from "../env";
import * as schema from "./schema";

export const sqlClient = new SQL({
  url: env.DATABASE_URL,
  max: Number(process.env.DB_POOL_SIZE ?? 10),
  idleTimeout: 30,
  connectionTimeout: 10,
  prepare: process.env.DB_PREPARE !== "false",
});

export const db = drizzle({ client: sqlClient, schema });
