import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  images: {
    unoptimized: true,
  },

  // Configure webpack to ignore the external folder
  webpack: (config: any) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/Chinesename.club/**', '**/node_modules/**'],
    };
    return config;
  },

  // Add empty turbopack config to silence Next.js 16 warning
  turbopack: {},
};

export default nextConfig;
