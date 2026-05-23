import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "**.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "http",
        hostname: "**.media-amazon.com",
      },
      {
        protocol: "http",
        hostname: "**.ssl-images-amazon.com",
      },
    ],
  },
};

export default nextConfig;

