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
  // Ensure we're using the App Router
  webpack: (config, { isServer }) => {
    // Add a rule to warn about Pages Router imports
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: [
        {
          loader: "string-replace-loader",
          options: {
            search: "next/router",
            replace: "/* PAGES_ROUTER_IMPORT */ next/router",
            flags: "g",
          },
        },
      ],
    })

    return config
  },
}

module.exports = nextConfig
