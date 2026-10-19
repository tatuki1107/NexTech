import { Elysia } from "elysia";

const swaggerHtml = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NexTech API Test Console</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true,
        tryItOutEnabled: true,
        requestInterceptor: (request) => {
          request.credentials = "include";
          return request;
        }
      });
    </script>
  </body>
</html>`;

const redocHtml = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NexTech API Reference</title>
    <style>body { margin: 0; padding: 0; } redoc { display: block; }</style>
  </head>
  <body>
    <redoc spec-url="/openapi.yaml"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`;

export const docsRoutes = new Elysia()
  .get("/docs", () => new Response(swaggerHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
    },
  }))
  .get("/redoc", () => new Response(redocHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
    },
  }))
  .get("/openapi.yaml", async () => new Response(
    await Bun.file(new URL("../../openapi/index.yaml", import.meta.url)).text(),
    {
      headers: {
        "content-type": "application/yaml; charset=utf-8",
        "cache-control": "no-cache",
      },
    },
  ));
