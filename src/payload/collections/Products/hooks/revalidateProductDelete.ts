import type { AfterDeleteHook } from 'payload/dist/collections/config/types'

import { revalidate } from '../../../utilities/revalidate'

export const revalidateProductDelete: AfterDeleteHook = ({ doc, req: { payload } }) => {
  revalidate({ payload, collection: 'products', slug: doc.slug })

  return doc
}
