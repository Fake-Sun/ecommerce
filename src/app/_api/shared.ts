const apiURL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  ''

export const GRAPHQL_API_URL = process.env.NEXT_BUILD
  ? `http://127.0.0.1:${process.env.PORT || 3000}`
  : apiURL.replace(/\/$/, '')

export const PUBLIC_CONTENT_REVALIDATE = 300
