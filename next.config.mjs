/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure we're not trying to transpile URL imports
  transpilePackages: [],
  // Explicitly ignore the supabase directory during build
  webpack: (config, { isServer }) => {
    // Add a rule to ignore URL imports
    config.module.rules.push({
      test: /\.ts$/,
      include: /supabase\/functions/,
      use: 'null-loader',
    });
    
    return config;
  },
};

export default nextConfig
