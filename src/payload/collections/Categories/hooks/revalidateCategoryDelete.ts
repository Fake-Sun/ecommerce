import type { AfterDeleteHook } from 'payload/dist/collections/config/types'

import { revalidate } from '../../../utilities/revalidate'

export const revalidateCategoryDelete: AfterDeleteHook = ({ doc, req: { payload } }) => {
  revalidate({ payload, collection: 'categories', slug: doc.id })
  revalidate({ payload, collection: 'products' })

  return doc
}
