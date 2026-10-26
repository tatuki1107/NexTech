process.env.NODE_ENV = "test";
process.env.JWT_SECRET ??= "unit-test-only-secret-at-least-32-characters";
if (process.env.RUN_DB_TESTS === "1") {
  if (!process.env.TEST_DATABASE_URL) throw new Error("Integration tests require a dedicated TEST_DATABASE_URL");
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  // Unit tests do not query the database. Keep them independent of local .env files.
  process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
}
