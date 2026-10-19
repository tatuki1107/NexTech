import { expect } from "bun:test";

type Schema = { $ref?: string; type?: string; nullable?: boolean; allOf?: Schema[]; oneOf?: Schema[]; required?: string[]; properties?: Record<string, Schema>; items?: Schema; enum?: unknown[]; format?: string; minimum?: number; maximum?: number };
type ResponseSchema = { $ref?: string; content?: Record<string, { schema: Schema }> };
export type Operation = { responses: Record<string, ResponseSchema>; security?: unknown[]; parameters?: Array<{ name?: string; in?: string; schema?: Schema; $ref?: string }> };
export const specification = Bun.YAML.parse(await Bun.file(new URL("../openapi/index.yaml", import.meta.url)).text()) as { paths: Record<string, Record<string, Operation>>; components: { schemas: Record<string, Schema>; responses: Record<string, ResponseSchema> } };

const errors = (value: unknown, original: Schema, path = "$"): string[] => {
  const schema = original.$ref ? { ...specification.components.schemas[original.$ref.split("/").slice(-1)[0]!], ...original, $ref: undefined } : original;
  if (value === null) return schema.nullable ? [] : [`${path}: unexpected null`];
  if (schema.allOf) return schema.allOf.flatMap(part => errors(value, part, path));
  if (schema.oneOf) return schema.oneOf.some(part => errors(value, part, path).length === 0) ? [] : [`${path}: no matching schema`];
  if (schema.enum && !schema.enum.includes(value)) return [`${path}: invalid enum ${String(value)}`];
  if (schema.type === "object") {
    if (typeof value !== "object" || !value || Array.isArray(value)) return [`${path}: expected object`];
    const record = value as Record<string, unknown>;
    return [...(schema.required ?? []).filter(key => !(key in record)).map(key => `${path}.${key}: missing`), ...Object.entries(schema.properties ?? {}).flatMap(([key, property]) => key in record ? errors(record[key], property, `${path}.${key}`) : [])];
  }
  if (schema.type === "array") return Array.isArray(value) ? value.flatMap((entry, index) => schema.items ? errors(entry, schema.items, `${path}[${index}]`) : []) : [`${path}: expected array`];
  if (schema.type === "integer" && !Number.isInteger(value)) return [`${path}: expected integer`];
  if (schema.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) return [`${path}: expected number`];
  if (schema.type === "boolean" && typeof value !== "boolean") return [`${path}: expected boolean`];
  if (schema.type === "string") {
    if (typeof value !== "string") return [`${path}: expected string`];
    if (schema.format === "date-time" && (!/^\d{4}-\d\d-\d\dT/.test(value) || Number.isNaN(Date.parse(value)))) return [`${path}: invalid timestamp`];
    if (schema.format === "uuid" && !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value)) return [`${path}: invalid uuid`];
  }
  return [];
};

export const assertContract = (path: string, method: string, response: Response, payload: unknown): void => {
  const pathname = new URL(path, "http://localhost").pathname.replace(/^\/api\/v1/, "");
  const route = Object.keys(specification.paths).find(pattern => new RegExp(`^${pattern.replace(/\{[^}]+\}/g, "[^/]+")}$`).test(pathname));
  if (!route) return;
  const operation = specification.paths[route]![method.toLowerCase()];
  expect(operation, `${method} ${route} is documented`).toBeDefined();
  let documented = operation.responses[String(response.status)];
  expect(documented, `${method} ${route}: undocumented status ${response.status}`).toBeDefined();
  if (documented.$ref) documented = specification.components.responses[documented.$ref.split("/").slice(-1)[0]!]!;
  if (response.status === 204) expect(payload).toBeNull();
  else {
    expect(response.headers.get("content-type")).toContain("application/json");
    const schema = documented.content?.["application/json"]?.schema;
    expect(schema).toBeDefined();
    expect(errors(payload, schema!), `${method} ${route} (${response.status}) response contract`).toEqual([]);
  }
};
