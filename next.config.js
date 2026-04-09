/** @type {import('next').NextConfig} */
const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  'http://localhost:3000'
const parsedServerURL = new URL(serverURL)

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: parsedServerURL.protocol.replace(':', ''),
        hostname: parsedServerURL.hostname,
        port: parsedServerURL.port,
        pathname: '/media/**',
      },
    ],
  },
}

module.exports = nextConfig
