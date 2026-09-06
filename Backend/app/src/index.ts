import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { sql } from "drizzle-orm";
import { db } from "./db/client";

const app = new Elysia()
  .use(cors())
  .get("/api", () => ({ message: "Hello Elysia" }))
  .get("/api/db-health", async () => {
    await db.execute(sql`select 1`);  //DBが返答できるかのテスト用
    return { message: "Database connected" };
  })
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);