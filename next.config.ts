import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server-only secrets must never be inlined into the client bundle.
  // Anything the browser is allowed to see must be prefixed NEXT_PUBLIC_.
  serverExternalPackages: ["openai"],
};

export default nextConfig;
