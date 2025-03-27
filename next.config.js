/** @type {import('next').NextConfig} */
const ContentSecurityPolicy = require('./csp')
const redirects = require('./redirects')

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/media/**',
      },
    ],
  },
  // 👇 Add this
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: '/media/:path*',
      },
    ]
  },
}

module.exports = nextConfig
