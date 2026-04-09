const trimmedServerURL = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')

export const SERVER_URL = trimmedServerURL

export const getMediaURL = (filename?: string | null): string => {
  if (!filename) return ''

  if (!trimmedServerURL) {
    return `/media/${filename}`
  }

  return `${trimmedServerURL}/media/${filename}`
}
