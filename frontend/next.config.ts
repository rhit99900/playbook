import type { NextConfig } from "next";
const path = require('path');

const nextConfig: NextConfig = {
  env: {
    API_BASE_URI: process.env.NEXT_PUBLIC_API_BASE_URI,
    PORT: process.env.APPLICATION_PORT
  },  
  outputFileTracingRoot: path.join(__dirname, '')
};

export default nextConfig;
