/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  // Remove standalone for now - causes issues on Render
  // output: 'standalone',
}

module.exports = nextConfig
