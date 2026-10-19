import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep build tracing inside this app even when a parent directory contains
  // an unrelated lockfile.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
