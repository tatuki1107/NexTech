import { proxyParticipantApi } from "@/app/_lib/api-proxy";

async function handle(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyParticipantApi(request, (await context.params).path);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
