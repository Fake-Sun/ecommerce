/** @type {import('next').NextConfig} */
const ContentSecurityPolicy = require('./csp');

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  swcMinify: true,
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_SERVER_URL]
      .filter(Boolean)
      .map(url => url.replace(/https?:\/\//, '')),
  },
};

module.exports = nextConfig;
