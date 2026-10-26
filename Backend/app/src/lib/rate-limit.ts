import { ApiError } from "./errors";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
let nextSweepAt = 0;

export const assertRateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): void => {
  const now = Date.now();
  if (now >= nextSweepAt || buckets.size >= MAX_BUCKETS) {
    for (const [storedKey, stored] of buckets)
      if (stored.resetAt <= now) buckets.delete(storedKey);
    nextSweepAt = now + 1_000;
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (!bucket && buckets.size >= MAX_BUCKETS)
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "しばらく待ってから再度お試しください",
      );
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit)
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "しばらく待ってから再度お試しください",
    );
};
