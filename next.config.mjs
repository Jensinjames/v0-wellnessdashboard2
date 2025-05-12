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
  // Update experimental features with correct object structure for serverActions
  experimental: {
    // Server Actions are now stable in Next.js 14+, but we configure it properly for compatibility
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'rollen-wellness.vercel.app'],
    },
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
