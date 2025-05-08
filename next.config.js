/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Explicitly disable the Pages Router
  experimental: {
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Redirect any requests to /pages/* to /app/*
  async redirects() {
    return [
      {
        source: "/pages/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
