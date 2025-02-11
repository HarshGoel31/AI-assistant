import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Export static files
  images: {
    unoptimized: true, // Required for static export if using images
  },
  basePath: "/AI-assistant", // Replace with your GitHub repo name
  assetPrefix: "/AI-assistant/",
};

export default nextConfig;
