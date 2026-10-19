export async function GET() {
  const apiBaseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(`${apiBaseUrl}/api/events`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const events: unknown = await response.json();
      return Response.json(events);
    }
  } catch {
    // Return a stable public error without leaking the internal API address.
  }
  return Response.json(
    { error: { code: "EVENTS_UNAVAILABLE", message: "イベント一覧を取得できませんでした。" } },
    { status: 502 },
  );
}
