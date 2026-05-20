import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["jsfuck-gen"],
};

export default nextConfig;
