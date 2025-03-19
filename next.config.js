/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any necessary configurations here
  reactStrictMode: true,
  swcMinify: true,
  
  // Ignore ESLint errors during build
  eslint: {
    // Warning instead of error during builds
    ignoreDuringBuilds: true,
  },
  
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // If you're having issues with specific packages:
  transpilePackages: ['problematic-package-name'],
}

module.exports = nextConfig 