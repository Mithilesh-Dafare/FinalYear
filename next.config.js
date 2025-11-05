/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  experimental: {
    // Disable Tailwind CSS Oxide engine
    tailwindcss: {
      oxideResolver: false
    }
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

module.exports = nextConfig;