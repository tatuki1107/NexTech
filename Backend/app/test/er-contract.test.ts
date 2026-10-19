import { expect, test } from "bun:test";
import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "../src/db/schema";

test("ER diagram contains every Drizzle table and column", async () => {
  const diagram = await Bun.file(new URL("../../../docs/database/ER_DIAGRAM.md", import.meta.url)).text();
  const documented = new Map<string, string[]>();
  for (const match of diagram.matchAll(/^  (\w+) \{\n([\s\S]*?)^  \}/gm)) {
    documented.set(match[1]!, match[2]!.trim().split("\n").map(line => line.trim().split(/\s+/)[1]!).sort());
  }
  const tables = Object.values(schema).filter(value => is(value, PgTable)).map(table => getTableConfig(table));
  expect([...documented.keys()].sort()).toEqual(tables.map(table => table.name).sort());
  for (const table of tables) expect(documented.get(table.name), table.name).toEqual(table.columns.map(column => column.name).sort());
});
