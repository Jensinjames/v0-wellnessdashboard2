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
  // Handle URL imports at build time instead of installation time
  webpack: (config) => {
    // Add a rule to handle URL imports
    config.module.rules.push({
      test: /\.(js|ts|tsx)$/,
      enforce: 'pre',
      use: [{
        loader: 'string-replace-loader',
        options: {
          search: 'import\\s+[^;]*?\\s+from\\s+[\'"]https?:\\/\\/[^\'"]+[\'"];?',
          replace: '// URL import removed',
          flags: 'g'
        }
      }]
    });
    
    return config;
  }
};

export default nextConfig;
