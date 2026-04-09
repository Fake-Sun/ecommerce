import type { Metadata } from 'next'

import type { Page, Product } from '../../payload/payload-types'
import { SERVER_URL } from './getServerURL'
import { mergeOpenGraph } from './mergeOpenGraph'

export const generateMeta = async (args: { doc: Page | Product }): Promise<Metadata> => {
  const { doc } = args || {}

  let ogImage: string | undefined

  if (
    doc?.meta?.image &&
    typeof doc.meta.image === 'object' &&
    'url' in doc.meta.image &&
    doc.meta.image.url
  ) {
    ogImage = `${SERVER_URL}${doc.meta.image.url}`
  }

  return {
    title: doc?.meta?.title || 'Payload',
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      title: doc?.meta?.title || 'Payload',
      description: doc?.meta?.description,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
      images: ogImage ? [{ url: ogImage }] : undefined,
    }),
  }
}
