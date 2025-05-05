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
  // Explicitly ignore the supabase directory during build
  webpack: (config, { isServer }) => {
    // Add a rule to ignore URL imports
    config.module.rules.push({
      test: /\.(js|ts|tsx)$/,
      loader: 'string-replace-loader',
      options: {
        search: /import\s+.*from\s+["']https?:\/\/.*["']/g,
        replace: '// URL import removed for build',
        flags: 'g'
      }
    });
    
    return config;
  },
};

export default nextConfig;
