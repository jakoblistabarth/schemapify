import os from "node:os";

/**
 * This machine's own hostname, which on macOS is its Bonjour name.
 */
const devHost = os.hostname();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  allowedDevOrigins: [devHost],
};

export default nextConfig;
