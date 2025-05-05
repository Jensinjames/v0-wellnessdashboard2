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
  webpack: (config) => {
    // Handle URL imports
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: [
        {
          loader: 'string-replace-loader',
          options: {
            search: /import\s+.*?\s+from\s+['"]https?:\/\/[^'"]+['"]|import\s*$$\s*['"]https?:\/\/[^'"]+['"]s*$$/g,
            replace: '/* URL import removed for build */',
            flags: 'g'
          }
        }
      ]
    });
    
    return config;
  },
};

export default nextConfig;
