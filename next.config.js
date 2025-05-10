/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove swcMinify as it's now the default

  // Remove experimental.appDir as App Router is now the default
  experimental: {
    // Only keep necessary experimental features
  },

  // Ensure we're not using the Pages Router for new routes
  pageExtensions: ["tsx", "ts", "jsx", "js"],

  // Disable image optimization if not needed
  images: {
    domains: ["localhost"],
    unoptimized: true,
  },

  // Add any environment variables that need to be exposed to the browser
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE || "false",
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
