const specification = Bun.YAML.parse(
  await Bun.file(new URL("../openapi/index.yaml", import.meta.url)).text(),
) as Record<string, unknown>;

if (specification.openapi !== "3.0.3")
  throw new Error("OpenAPI version must be 3.0.3");
const paths = specification.paths as
  | Record<string, Record<string, unknown>>
  | undefined;
const components = specification.components as
  | Record<string, Record<string, unknown>>
  | undefined;
if (!paths || !components) throw new Error("paths and components are required");

const methods = new Set(["get", "post", "put", "patch", "delete"]);
let operations = 0;
for (const [path, pathItem] of Object.entries(paths)) {
  if (!path.startsWith("/")) throw new Error(`Invalid path: ${path}`);
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!methods.has(method)) continue;
    operations += 1;
    const responses = (operation as Record<string, unknown>).responses;
    if (!responses)
      throw new Error(`${method.toUpperCase()} ${path} has no responses`);
  }
}
if (operations !== 57)
  throw new Error(`Expected 57 operations, found ${operations}`);

const serialized = JSON.stringify(specification);
for (const match of serialized.matchAll(
  /#\/components\/(schemas|responses|parameters)\/([^"}]+)/g,
)) {
  const [, group, name] = match;
  if (!components[group!]?.[name!])
    throw new Error(`Unresolved reference: ${match[0]}`);
}

console.log(`OpenAPI lint passed: ${operations} operations`);
