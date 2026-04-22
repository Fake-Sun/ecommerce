const trimURL = (value?: string): string => (value || '').replace(/\/$/, '')

export const SITE_URL = trimURL(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SERVER_URL,
)
export const API_URL = trimURL(
  process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
)

export const getMediaURL = (args?: { filename?: string | null; url?: string | null }): string => {
  const url = args?.url
  const filename = args?.filename

  if (url) return url
  if (!filename) return ''

  if (!API_URL) {
    return `/media/${filename}`
  }

  return `${API_URL}/media/${filename}`
}

export const getAPIURL = (path = ''): string => {
  if (!path) return API_URL
  if (/^https?:\/\//.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return API_URL ? `${API_URL}${normalizedPath}` : normalizedPath
}

export const getSiteURL = (path = ''): string => {
  if (!path) return SITE_URL
  if (/^https?:\/\//.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return SITE_URL ? `${SITE_URL}${normalizedPath}` : normalizedPath
}
