import { ApiError } from "./errors";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let nextCleanupAt = 0;

export const assertRateLimit = (key: string, limit: number, windowMs: number): void => {
  const now = Date.now();
  if (now >= nextCleanupAt) {
    for (const [storedKey, stored] of buckets) if (stored.resetAt <= now) buckets.delete(storedKey);
    nextCleanupAt = now + 60_000;
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw new ApiError(429, "RATE_LIMITED", "しばらく待ってから再度お試しください");
};
