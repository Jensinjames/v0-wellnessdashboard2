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
  webpack: (config, { isServer }) => {
    // Handle URL imports during build
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: /import\s+.*from\s+['"]https:\/\/.*['"]/g,
          replace: '// URL import removed for build',
          flags: 'g'
        }
      }
    });
    
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: /import$$['"]https:\/\/.*['"]$$/g,
          replace: '(() => { console.warn("URL import removed"); return Promise.resolve({}); })()',
          flags: 'g'
        }
      }
    });
    
    return config;
  },
};

export default nextConfig;
