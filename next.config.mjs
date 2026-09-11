/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.FSC_LOCAL_PREVIEW === '1' ? '.fsc-local/build' : '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
