/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker multi-stage build
  // This generates a self-contained server.js with minimal dependencies
  output: 'standalone',
};

export default nextConfig;
