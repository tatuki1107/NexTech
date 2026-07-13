import { createApp } from "./app";
import { env } from "./env";

const app = createApp().listen(env.PORT);

console.log(`NexTech API is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
