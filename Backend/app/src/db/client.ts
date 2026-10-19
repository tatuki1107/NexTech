//PostgreSQLとの通信役と、アプリから使うDB窓口を一箇所に作ってくれるよ

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
}

const client = postgres(databaseUrl, { prepare: process.env.DB_PREPARE !== "false" });
export const db = drizzle({ client });
