import type { Payload } from 'payload'

export const revalidate = async (args: {
  collection: string
  slug?: string
  payload: Payload
}): Promise<void> => {
  const { collection, slug, payload } = args

  try {
    const params = new URLSearchParams({
      secret: process.env.REVALIDATION_KEY || '',
      collection,
    })

    if (slug) {
      params.set('slug', slug)
    }

    const res = await fetch(
      `${
        process.env.PAYLOAD_PUBLIC_SITE_URL || process.env.PAYLOAD_PUBLIC_SERVER_URL
      }/api/revalidate?${params.toString()}`,
    )

    if (res.ok) {
      payload.logger.info(
        `Revalidated collection '${collection}'${slug ? ` and slug '${slug}'` : ''}`,
      )
    } else {
      const body = await res.text()
      payload.logger.error(
        `Error revalidating collection '${collection}'${slug ? ` and slug '${slug}'` : ''}: ${
          res.status
        } ${res.statusText} ${body}`,
      )
    }
  } catch (err: unknown) {
    payload.logger.error(
      `Error hitting revalidate route for collection '${collection}'${
        slug ? ` and slug '${slug}'` : ''
      }: ${err}`,
    )
  }
}
