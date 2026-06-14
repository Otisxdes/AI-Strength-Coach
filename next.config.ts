import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip static prerender errors from Supabase during build
  // Pages with dynamic auth will render at request time
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

export default nextConfig;
