/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:*',
        '127.0.0.1:*',
        'http://localhost:*',
        'http://127.0.0.1:*',
      ],
      allowedForwardedHosts: [
        'localhost:*',
        '127.0.0.1:*',
        'http://localhost:*',
        'http://127.0.0.1:*',
      ],
      bypassOriginAndHostValidation: true,
      allowedHeaders: ['x-forwarded-host', 'origin'],
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
