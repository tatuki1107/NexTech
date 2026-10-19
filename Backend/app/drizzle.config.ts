import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env before running DB commands.");
}

export default defineConfig({
    out: "./drizzle",                   //自動生成するmigration SQLの出力先
    schema: "./src/db/schema.ts",       //TypeScriptで書くテーブル定義の場所
    dialect: "postgresql",              //PostgreSQL用のSQLを作る指定
    dbCredentials: {                    //DATABASE_URL: 操作対象のDB接続先
        url: databaseUrl,
    },
});
