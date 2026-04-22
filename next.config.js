/** @type {import('next').NextConfig} */
const apiURL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  'http://localhost:3000'
const parsedAPIURL = new URL(apiURL)
const r2PublicURL = process.env.R2_PUBLIC_URL
const parsedR2PublicURL = r2PublicURL ? new URL(r2PublicURL) : null

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
      ...(parsedR2PublicURL
        ? [
            {
              protocol: parsedR2PublicURL.protocol.replace(':', ''),
              hostname: parsedR2PublicURL.hostname,
              port: parsedR2PublicURL.port,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
