/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.simpleicons.org', 'localhost', 'paddle-billing.vercel.app'],
  },
  // Experimental configuration to avoid lightningcss issues
  experimental: {
    optimizePackageImports: ['lucide-react', 'crypto-js'],
  },
};

export default nextConfig;
