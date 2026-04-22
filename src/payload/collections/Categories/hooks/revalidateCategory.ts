import type { AfterChangeHook } from 'payload/dist/collections/config/types'

import { revalidate } from '../../../utilities/revalidate'

export const revalidateCategory: AfterChangeHook = ({ doc, req: { payload } }) => {
  revalidate({ payload, collection: 'categories', slug: doc.id })
  revalidate({ payload, collection: 'products' })

  return doc
}
