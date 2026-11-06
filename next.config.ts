import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@prisma/client", "bcryptjs"],
  // Dev overlay / HMR + Cloudflare quick tunnels (Edge HTTPS demos)
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.trycloudflare.com"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
