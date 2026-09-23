import type { Product } from '../../../payload/payload-types'

export interface Result {
  totalDocs: number
  docs: Product[]
  page: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  nextPage: number | null
  prevPage: number | null
}

export const CLIENT_CATALOG_LIMIT = 300

export const getProductDocuments = (docs?: Array<{ value: string | Product }>): Product[] => {
  return (docs || [])
    .map(doc => doc.value)
    .filter((doc): doc is Product => Boolean(doc && typeof doc === 'object' && doc.id))
}

export const isCompleteCatalog = (docs: Product[], totalDocs?: number): boolean => {
  return (
    typeof totalDocs === 'number' &&
    totalDocs === docs.length &&
    new Set(docs.map(doc => doc.id)).size === totalDocs &&
    docs.every(doc => Number.isFinite(Date.parse(doc.createdAt)))
  )
}

export const getLocalResult = (args: {
  docs: Product[]
  categories?: string[]
  archiveCategories?: string[]
  sort?: string
  page: number
  limit: number
}): Result => {
  const { docs, categories = [], archiveCategories = [], sort, page, limit } = args
  const filtered = docs.filter(product => {
    const productCategories = (product.categories || []).map(category => {
      return typeof category === 'string' ? category : category.id
    })

    // Match the API's `in` query: any selected category, within the archive's scope.
    return [categories, archiveCategories].every(group => {
      return group.length === 0 || group.some(id => productCategories.includes(id))
    })
  })

  if (sort) {
    const field = sort.replace(/^-/, '') === 'publishedOn' ? 'publishedOn' : 'createdAt'
    const direction = sort.startsWith('-') ? -1 : 1
    filtered.sort((a, b) => {
      const aDate = Date.parse(a[field]) || 0
      const bDate = Date.parse(b[field]) || 0
      return direction * (aDate - bDate)
    })
  }

  const totalDocs = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
  const safePage = Math.max(1, Math.min(page, totalPages))

  return {
    docs: filtered.slice((safePage - 1) * limit, safePage * limit),
    totalDocs,
    totalPages,
    page: safePage,
    hasPrevPage: safePage > 1,
    hasNextPage: safePage < totalPages,
    prevPage: safePage > 1 ? safePage - 1 : null,
    nextPage: safePage < totalPages ? safePage + 1 : null,
  }
}

export const fetchProductList = async (url: string, signal: AbortSignal): Promise<Result> => {
  const response = await fetch(url, { signal, cache: 'no-store' })
  if (!response.ok) throw new Error(`Product list request failed (${response.status})`)

  const result = await response.json()
  if (
    !Array.isArray(result?.docs) ||
    !Number.isInteger(result.totalDocs) ||
    result.totalDocs < result.docs.length ||
    !Number.isInteger(result.page) ||
    result.page < 1 ||
    !Number.isInteger(result.totalPages) ||
    result.totalPages < 1
  ) {
    throw new Error('Invalid product list response')
  }

  return result
}
