import type { PayloadHandler } from 'payload/config'
import type { Where } from 'payload/types'

interface ProductListImage {
  id: string
  alt?: string | null
  filename?: string | null
  url?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
}

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value)

  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.max(1, Math.floor(parsed))
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
  const startedAt = Date.now()
  try {
    const page = toPositiveInt(req.query.page, 1)
    const limit = Math.min(300, toPositiveInt(req.query.limit, 10))
    const sort = typeof req.query.sort === 'string' ? req.query.sort : '-createdAt'
    const categoryFilter = normalizeCategoryFilter(req.query.categories)
    const archiveCategories = normalizeCategoryFilter(req.query.archiveCategories)

    const categoryConditions = [categoryFilter, archiveCategories]
      .filter(categories => categories.length > 0)
      .map(categories => ({ categories: { in: categories } }))
    const where: Where = categoryConditions.length > 0 ? { and: categoryConditions } : {}

    const result = await req.payload.find({
      collection: 'products',
      req,
      overrideAccess: false,
      depth: 0,
      sort,
      page,
      limit,
      where,
    })
    const productsFinishedAt = Date.now()

    const mediaIDs = Array.from(
      new Set(
        result.docs
          .map(doc => {
            const image = doc.meta?.image

            if (!image) return null
            if (typeof image === 'string') return image
            if ('id' in image && image.id) return String(image.id)

            return null
          })
          .filter(Boolean) as string[],
      ),
    )

    const mediaMap = new Map<string, ProductListImage>()

    if (mediaIDs.length > 0) {
      const mediaResult = await req.payload.find({
        collection: 'media',
        req,
        overrideAccess: false,
        depth: 0,
        limit: mediaIDs.length,
        where: {
          id: {
            in: mediaIDs,
          },
        },
      })

      mediaResult.docs.forEach(mediaDoc => {
        mediaMap.set(String(mediaDoc.id), {
          id: String(mediaDoc.id),
          alt: mediaDoc.alt,
          filename: mediaDoc.filename,
          url: mediaDoc.url,
          mimeType: mediaDoc.mimeType,
          width: mediaDoc.width,
          height: mediaDoc.height,
        })
      })
    }
    const mediaFinishedAt = Date.now()

    const docs = result.docs.map(doc => {
      const directImage: ProductListImage | null =
        doc.meta?.image && typeof doc.meta.image !== 'string'
          ? {
              id: String(doc.meta.image.id),
              alt: doc.meta.image.alt,
              filename: doc.meta.image.filename,
              url: doc.meta.image.url,
              mimeType: doc.meta.image.mimeType,
              width: doc.meta.image.width,
              height: doc.meta.image.height,
            }
          : null

      const imageID =
        typeof doc.meta?.image === 'string'
          ? doc.meta.image
          : doc.meta?.image && 'id' in doc.meta.image
          ? String(doc.meta.image.id)
          : null

      return {
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        createdAt: doc.createdAt,
        publishedOn: doc.publishedOn,
        categories: Array.isArray(doc.categories)
          ? doc.categories.map(category => {
              return typeof category === 'string' ? category : String(category.id)
            })
          : [],
        meta: {
          description: doc.meta?.description,
          image: directImage || (imageID ? mediaMap.get(imageID) || null : null),
        },
        priceJSON: doc.priceJSON,
      }
    })

    res.setHeader('Cache-Control', 'no-store')
    res.setHeader(
      'Server-Timing',
      `products;dur=${productsFinishedAt - startedAt}, media;dur=${
        mediaFinishedAt - productsFinishedAt
      }, total;dur=${Date.now() - startedAt}`,
    )
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
