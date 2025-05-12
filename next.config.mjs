/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add experimental features to support Supabase auth
  experimental: {
    serverActions: true,
  },
  // Add redirects for auth callback
  async redirects() {
    return [
      {
        source: '/auth/callback',
        has: [
          {
            type: 'query',
            key: 'error_description',
          },
        ],
        destination: '/auth/error?error_description=:error_description',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
