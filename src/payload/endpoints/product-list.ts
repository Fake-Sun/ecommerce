import type { PayloadHandler } from 'payload/config'
import type { Where } from 'payload/types'

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value)

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }

  return fallback
}

const normalizeCategoryFilter = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

export const productList: PayloadHandler = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page, 1)
    const limit = toPositiveInt(req.query.limit, 10)
    const sort = typeof req.query.sort === 'string' ? req.query.sort : '-createdAt'
    const categoryFilter = normalizeCategoryFilter(req.query.categories)

    const where: Where = {}

    if (categoryFilter.length > 0) {
      where.categories = {
        in: categoryFilter,
      }
    }

    const result = await req.payload.find({
      collection: 'products',
      depth: 1,
      sort,
      page,
      limit,
      where,
    })

    const docs = result.docs.map(doc => ({
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      meta: {
        description: doc.meta?.description,
        image:
          doc.meta?.image && typeof doc.meta.image !== 'string'
            ? {
                id: doc.meta.image.id,
                alt: doc.meta.image.alt,
                filename: doc.meta.image.filename,
                mimeType: doc.meta.image.mimeType,
                width: doc.meta.image.width,
                height: doc.meta.image.height,
              }
            : null,
      },
      priceJSON: doc.priceJSON,
    }))

    res.status(200).json({
      docs,
      totalDocs: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
    })
  } catch (error: unknown) {
    req.payload.logger.error(`Error fetching product list: ${error}`)
    res.status(500).json({ error: 'Unable to fetch product list' })
  }
}
