'use client'

import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import qs from 'qs'

import { Category, Product } from '../../../payload/payload-types'
import type { ArchiveBlockProps } from '../../_blocks/ArchiveBlock/types'
import { useFilter } from '../../_providers/Filter'
import { getAPIURL } from '../../_utilities/getServerURL'
import { Card } from '../Card'
import { PageRange } from '../PageRange'
import { Pagination } from '../Pagination'

import classes from './index.module.scss'

type Result = {
  totalDocs: number
  docs: Product[]
  page: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  nextPage: number
  prevPage: number
}

export type Props = {
  className?: string
  relationTo?: 'products'
  populateBy?: 'collection' | 'selection'
  showPageRange?: boolean
  onResultChange?: (result: Result) => void // eslint-disable-line no-unused-vars
  limit?: number
  populatedDocs?: ArchiveBlockProps['populatedDocs']
  selectedDocs: { relationTo: 'products'; value: string | Product }[]
  populatedDocsTotal?: ArchiveBlockProps['populatedDocsTotal']
  categories?: ArchiveBlockProps['categories']
  sort?: string
}

export const CollectionArchive: React.FC<Props> = props => {
  const { categoryFilters, sort } = useFilter()
  const pathname = usePathname()

  const {
    className,
    relationTo,
    populateBy,
    showPageRange,
    onResultChange,
    limit = 10,
    populatedDocs,
    populatedDocsTotal,
  } = props

  const [results, setResults] = useState<Result>({
    totalDocs: typeof populatedDocsTotal === 'number' ? populatedDocsTotal : 0,
    docs: (populatedDocs?.map(doc => doc.value) || []) as [],
    page: 1,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: 1,
    nextPage: 1,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasHydrated = useRef(false)
  const resultCache = useRef(new Map<string, Result>())
  const [allProductDocs, setAllProductDocs] = useState<Product[] | null>(null)
  const [page, setPage] = useState(1)

  const shouldUseClientFiltering =
    pathname === '/products' && relationTo === 'products' && populateBy === 'collection'

  const scrollToRef = useCallback(() => {
    const { current } = scrollRef
    if (current) {
      // current.scrollIntoView({
      //   behavior: 'smooth',
      // })
    }
  }, [])

  useEffect(() => {
    if (!isLoading && typeof results.page !== 'undefined') {
      // scrollToRef()
    }
  }, [isLoading, scrollToRef, results])

  useEffect(() => {
    setPage(1)
  }, [categoryFilters, sort])

  useEffect(() => {
    if (!shouldUseClientFiltering || allProductDocs) return

    let isMounted = true

    const loadAllProducts = async () => {
      try {
        const req = await fetch(
          `${getAPIURL('/api/products-list')}?${qs.stringify(
            {
              sort: '-createdAt',
              limit: 300,
              page: 1,
            },
            { encode: false },
          )}`,
        )
        const json = await req.json()

        if (!isMounted) return

        const { docs } = json as { docs?: Product[] }

        if (docs && Array.isArray(docs)) {
          setAllProductDocs(docs)
        }
      } catch (err) {
        console.warn(err) // eslint-disable-line no-console
      }
    }

    loadAllProducts()

    return () => {
      isMounted = false
    }
  }, [allProductDocs, shouldUseClientFiltering])

  useEffect(() => {
    if (!shouldUseClientFiltering || !allProductDocs) return

    const filteredDocs = allProductDocs.filter(product => {
      if (!categoryFilters || categoryFilters.length === 0) return true

      const productCategories = Array.isArray(product.categories)
        ? product.categories.map(category => {
            return typeof category === 'string' ? category : String(category?.id)
          })
        : []

      return categoryFilters.every(filterID => productCategories.includes(filterID))
    })

    const sortedDocs = [...filteredDocs].sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime()
      const bDate = new Date(b.createdAt || 0).getTime()

      if (sort === 'createdAt') {
        return aDate - bDate
      }

      return bDate - aDate
    })

    const totalDocs = sortedDocs.length
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
    const safePage = Math.min(page, totalPages)
    const startIndex = (safePage - 1) * limit
    const docs = sortedDocs.slice(startIndex, startIndex + limit)

    const nextResults: Result = {
      docs,
      totalDocs,
      page: safePage,
      totalPages,
      hasPrevPage: safePage > 1,
      hasNextPage: safePage < totalPages,
      prevPage: safePage > 1 ? safePage - 1 : 1,
      nextPage: safePage < totalPages ? safePage + 1 : totalPages,
    }

    setResults(nextResults)
    setIsLoading(false)
    setError(undefined)

    if (safePage !== page) {
      setPage(safePage)
      return
    }

    if (typeof onResultChange === 'function') {
      onResultChange(nextResults)
    }
  }, [allProductDocs, categoryFilters, limit, onResultChange, page, shouldUseClientFiltering, sort])

  useEffect(() => {
    if (shouldUseClientFiltering && allProductDocs) {
      return
    }

    // hydrate the block with fresh content after first render
    // don't show loader unless the request takes longer than x ms
    // and don't show it during initial hydration
    const timer: NodeJS.Timeout = setTimeout(() => {
      if (hasHydrated) {
        setIsLoading(true)
      }
    }, 500)

    const searchQuery = qs.stringify(
      {
        sort,
        ...(categoryFilters && categoryFilters?.length > 0
          ? {
              categories: categoryFilters.join(','),
            }
          : {}),
        limit,
        page,
      },
      { encode: false },
    )

    if (
      !hasHydrated.current &&
      page === 1 &&
      (!categoryFilters || categoryFilters.length === 0) &&
      results.docs.length > 0
    ) {
      hasHydrated.current = true
      resultCache.current.set(searchQuery, results)
      return
    }

    const cachedResult = resultCache.current.get(searchQuery)

    if (cachedResult) {
      hasHydrated.current = true
      setResults(cachedResult)
      setIsLoading(false)
      setError(undefined)

      if (typeof onResultChange === 'function') {
        onResultChange(cachedResult)
      }

      clearTimeout(timer)
      return
    }

    const makeRequest = async () => {
      try {
        const req = await fetch(`${getAPIURL('/api/products-list')}?${searchQuery}`)
        const json = await req.json()
        clearTimeout(timer)
        hasHydrated.current = true

        const { docs } = json as { docs: Product[] }

        if (docs && Array.isArray(docs)) {
          resultCache.current.set(searchQuery, json)
          setResults(json)
          setIsLoading(false)
          setError(undefined)
          if (typeof onResultChange === 'function') {
            onResultChange(json)
          }
        }
      } catch (err) {
        console.warn(err) // eslint-disable-line no-console
        setIsLoading(false)
        setError(`Unable to load "${relationTo} archive" data at this time.`)
      }
    }

    makeRequest()

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [
    allProductDocs,
    page,
    categoryFilters,
    relationTo,
    onResultChange,
    shouldUseClientFiltering,
    sort,
    limit,
  ])

  return (
    <div className={[classes.collectionArchive, className].filter(Boolean).join(' ')}>
      <div ref={scrollRef} className={classes.scrollRef} />
      {!isLoading && error && <div>{error}</div>}
      <Fragment>
        {showPageRange !== false && (
          <div className={classes.pageRange}>
            <PageRange
              totalDocs={results.totalDocs}
              currentPage={results.page}
              collection={relationTo}
              limit={limit}
            />
          </div>
        )}

        <div className={classes.grid}>
          {results.docs?.map((result, index) => {
            return <Card key={index} relationTo="products" doc={result} showCategories />
          })}
        </div>

        {results.totalPages > 1 && (
          <Pagination
            className={classes.pagination}
            page={results.page}
            totalPages={results.totalPages}
            onClick={setPage}
          />
        )}
      </Fragment>
    </div>
  )
}
