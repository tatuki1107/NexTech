import { expect, test } from "bun:test";
import { createApp } from "../src/app";

test("health endpoint responds without database access", async () => {
  const response = await createApp().handle(new Request("http://localhost/health"));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers.get("x-request-id")).toBeTruthy();
});

test("validation errors use the common envelope", async () => {
  const response = await createApp().handle(new Request("http://localhost/api/v1/auth/signup", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "invalid" }),
  }));
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: { code: "VALIDATION_ERROR", message: "入力内容を確認してください" } });
});

test("API test console points to the served OpenAPI document", async () => {
  const app = createApp();
  const docsResponse = await app.handle(new Request("http://localhost/docs"));
  expect(docsResponse.status).toBe(200);
  expect(docsResponse.headers.get("content-type")).toContain("text/html");
  const docsHtml = await docsResponse.text();
  expect(docsHtml).toContain("SwaggerUIBundle");
  expect(docsHtml).toContain('url: "/openapi.yaml"');
  expect(docsHtml).toContain('request.credentials = "include"');

  const redocResponse = await app.handle(new Request("http://localhost/redoc"));
  expect(redocResponse.status).toBe(200);
  expect(await redocResponse.text()).toContain('spec-url="/openapi.yaml"');

  const specificationResponse = await app.handle(new Request("http://localhost/openapi.yaml"));
  expect(specificationResponse.status).toBe(200);
  expect(specificationResponse.headers.get("content-type")).toContain("application/yaml");
  expect(await specificationResponse.text()).toStartWith("openapi: 3.0.3");
});
