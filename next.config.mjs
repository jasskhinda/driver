/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve images as-is. Vercel's image optimization quota (Hobby plan) ran out and returned
  // 402, which left logos blank on the live sites.
  images: { unoptimized: true },
  output: 'standalone',
};

export default nextConfig;
