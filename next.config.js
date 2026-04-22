/** @type {import('next').NextConfig} */
const apiURL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  'http://localhost:3000'
const parsedAPIURL = new URL(apiURL)

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: parsedAPIURL.protocol.replace(':', ''),
        hostname: parsedAPIURL.hostname,
        port: parsedAPIURL.port,
        pathname: '/media/**',
      },
    ],
  },
}

module.exports = nextConfig
