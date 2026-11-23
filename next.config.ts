import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 80],
  },
};

export default nextConfig;
