import { expect, test } from "bun:test";
import { createApp } from "../src/app";

test("OpenAPI defines every MVP operation and refresh", async () => {
  const specification = Bun.YAML.parse(
    await Bun.file(new URL("../openapi/index.yaml", import.meta.url)).text(),
  ) as {
    servers: Array<{ url: string }>;
    paths: Record<string, Record<string, unknown>>;
  };
  const methods = new Set(["get", "post", "put", "patch", "delete"]);
  const operationCount = Object.values(specification.paths)
    .flatMap((item) => Object.keys(item))
    .filter((method) => methods.has(method)).length;
  expect(operationCount).toBe(58);
  expect(specification.paths["/auth/refresh"]?.post).toBeDefined();
  expect(
    specification.servers.some(
      ({ url }) => url === "http://localhost:3001/api/v1",
    ),
  ).toBeTrue();

  const documented = new Set<string>();
  for (const [path, item] of Object.entries(specification.paths)) {
    const runtimePath = `/api/v1${path}`.replaceAll(/\{([^}]+)\}/g, ":$1");
    for (const method of Object.keys(item))
      if (methods.has(method))
        documented.add(`${method.toUpperCase()} ${runtimePath}`);
  }
  const implemented = new Set(
    createApp()
      .routes.filter(
        ({ path, method }) =>
          path.startsWith("/api/v1") && methods.has(method.toLowerCase()),
      )
      .map(({ path, method }) => `${method} ${path}`),
  );
  expect(implemented).toEqual(documented);
});
