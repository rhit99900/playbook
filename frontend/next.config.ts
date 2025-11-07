import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_BASE_URI: process.env.API_BASE_URI
  }
};

export default nextConfig;
