import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

import type { Config } from '../../payload/payload-types'
import { CATEGORIES } from '../_graphql/categories'
import { ORDERS } from '../_graphql/orders'
import { PAGES } from '../_graphql/pages'
import { PRODUCTS } from '../_graphql/products'
import { GRAPHQL_API_URL, PUBLIC_CONTENT_REVALIDATE } from './shared'
import { payloadToken } from './token'

const queryMap = {
  pages: {
    query: PAGES,
    key: 'Pages',
  },
  products: {
    query: PRODUCTS,
    key: 'Products',
  },
  orders: {
    query: ORDERS,
    key: 'Orders',
  },
  categories: {
    query: CATEGORIES,
    key: 'Categories',
  },
}

export const fetchDocs = async <T>(
  collection: keyof Config['collections'],
  draft?: boolean,
): Promise<T[]> => {
  if (!queryMap[collection]) throw new Error(`Collection ${collection} not found`)

  let token: RequestCookie | undefined

  if (draft) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    token = cookieStore.get(payloadToken)
  }

  const fetchOptions: RequestInit & {
    next?: {
      revalidate?: number
      tags?: string[]
    }
  } = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token?.value && draft ? { Authorization: `JWT ${token.value}` } : {}),
    },
    body: JSON.stringify({
      query: queryMap[collection].query,
    }),
  }

  if (draft) {
    fetchOptions.cache = 'no-store'
  } else {
    fetchOptions.next = {
      revalidate: PUBLIC_CONTENT_REVALIDATE,
      tags: [collection],
    }
  }

  const docs: T[] = await fetch(`${GRAPHQL_API_URL}/api/graphql`, {
    ...fetchOptions,
  })
    ?.then(res => res.json())
    ?.then(res => {
      if (res.errors) throw new Error(res?.errors?.[0]?.message ?? 'Error fetching docs')

      return res?.data?.[queryMap[collection].key]?.docs
    })

  return docs
}
