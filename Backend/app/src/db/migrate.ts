import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { sqlClient } from ".";

await sqlClient`CREATE TABLE IF NOT EXISTS __nextech_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;

const migrationDir = join(import.meta.dir, "../../drizzle");
const files = (await readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort();

for (const name of files) {
  const applied = await sqlClient`SELECT 1 FROM __nextech_migrations WHERE name = ${name}`;
  if (applied.length > 0) continue;
  const migration = await Bun.file(join(migrationDir, name)).text();
  await sqlClient.begin(async (transaction) => {
    await transaction.unsafe(migration).simple();
    await transaction`INSERT INTO __nextech_migrations (name) VALUES (${name})`;
  });
  console.log(`Applied migration: ${name}`);
}

await sqlClient.close();
