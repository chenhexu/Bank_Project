/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    // Use provided API URL or fall back to empty string to use window.location.origin at runtime
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  
  // In development, proxy API requests to the FastAPI backend on port 8000
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
  
  // Output configuration for standalone deployment
  output: 'standalone',
  
  // Disable image optimization for development
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
