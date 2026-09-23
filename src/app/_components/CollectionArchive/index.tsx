'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import qs from 'qs'

import type { Product } from '../../../payload/payload-types'
import type { ArchiveBlockProps } from '../../_blocks/ArchiveBlock/types'
import { useFilter } from '../../_providers/Filter'
import { getAPIURL } from '../../_utilities/getServerURL'
import { Card } from '../Card'
import { PageRange } from '../PageRange'
import { Pagination } from '../Pagination'
import {
  CLIENT_CATALOG_LIMIT,
  fetchProductList,
  getLocalResult,
  getProductDocuments,
  isCompleteCatalog,
  Result,
} from './results'

import classes from './index.module.scss'

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
  const { categoryFilters, sort: filterSort } = useFilter()
  const pathname = usePathname()
  const {
    className,
    relationTo,
    populateBy,
    showPageRange,
    onResultChange,
    populatedDocs,
    populatedDocsTotal,
    selectedDocs,
  } = props
  const limit = Math.min(CLIENT_CATALOG_LIMIT, Math.max(1, Math.floor(props.limit || 10)))
  const isSelection = populateBy === 'selection'
  const isProductListing = pathname === '/products' && relationTo === 'products' && !isSelection
  const sort = isProductListing ? filterSort : props.sort || '-publishedOn'
  const categoryKey = isProductListing ? [...categoryFilters].sort().join(',') : ''
  const archiveCategoryKey = (props.categories || [])
    .map(category => (typeof category === 'string' ? category : category.id))
    .sort()
    .join(',')
  const filterKey = JSON.stringify([categoryKey, archiveCategoryKey, sort, limit])
  const [pagination, setPagination] = useState({ filterKey, page: 1 })
  const page = pagination.filterKey === filterKey ? pagination.page : 1

  useEffect(() => {
    setPagination({ filterKey, page: 1 })
  }, [filterKey])

  const initialDocs = useMemo(
    () => getProductDocuments(isSelection ? selectedDocs : populatedDocs),
    [isSelection, selectedDocs, populatedDocs],
  )
  const [catalog, setCatalog] = useState<{
    source: Props['populatedDocs']
    scope: string
    docs: Product[] | null
  } | null>(null)
  const currentCatalog =
    catalog?.source === populatedDocs && catalog?.scope === archiveCategoryKey ? catalog : null
  const localDocs = isSelection
    ? initialDocs
    : isProductListing && isCompleteCatalog(initialDocs, populatedDocsTotal)
    ? initialDocs
    : isProductListing
    ? currentCatalog?.docs ?? null
    : null

  // Load a bounded catalog once, not one request per filter click. Large catalogs stay paginated.
  const loadCatalog =
    isProductListing &&
    localDocs === null &&
    !currentCatalog &&
    (populatedDocsTotal === undefined || populatedDocsTotal <= CLIENT_CATALOG_LIMIT)
  const requestKey =
    localDocs !== null
      ? null
      : qs.stringify({
          sort: loadCatalog ? '-createdAt' : sort,
          categories: loadCatalog ? undefined : categoryKey || undefined,
          archiveCategories: archiveCategoryKey || undefined,
          limit: loadCatalog ? CLIENT_CATALOG_LIMIT : limit,
          page: loadCatalog ? 1 : page,
        })
  const [remote, setRemote] = useState<{
    source: Props['populatedDocs']
    key: string
    result?: Result
    error?: string
  } | null>(null)

  useEffect(() => {
    if (requestKey === null) return
    const controller = new AbortController()

    const load = async () => {
      try {
        const result = await fetchProductList(
          `${getAPIURL('/api/products-list')}?${requestKey}`,
          controller.signal,
        )
        if (controller.signal.aborted) return

        if (loadCatalog) {
          setCatalog({
            source: populatedDocs,
            scope: archiveCategoryKey,
            docs: isCompleteCatalog(result.docs, result.totalDocs) ? result.docs : null,
          })
        } else {
          setRemote({ source: populatedDocs, key: requestKey, result })
        }
      } catch (err) {
        if (controller.signal.aborted) return
        if (loadCatalog) {
          // A failed prefetch must not disable the normal paginated archive.
          setCatalog({ source: populatedDocs, scope: archiveCategoryKey, docs: null })
        } else {
          setRemote({
            source: populatedDocs,
            key: requestKey,
            error: `Unable to load "${relationTo} archive" data at this time.`,
          })
        }
      }
    }

    void load()
    return () => controller.abort()
  }, [archiveCategoryKey, loadCatalog, populatedDocs, relationTo, requestKey])

  const currentRemote = remote?.source === populatedDocs ? remote : null
  const isCurrentRequest = currentRemote?.key === requestKey
  const error = requestKey !== null && isCurrentRequest ? currentRemote?.error : undefined
  const isLoading = requestKey !== null && !isCurrentRequest
  // Keep result identity stable for consumers of onResultChange.
  const results = useMemo(() => {
    if (localDocs !== null) {
      return getLocalResult({
        docs: localDocs,
        categories: isSelection ? [] : categoryKey.split(',').filter(Boolean),
        archiveCategories: isSelection ? [] : archiveCategoryKey.split(',').filter(Boolean),
        sort: isSelection ? undefined : sort,
        page,
        limit,
      })
    }
    if (currentRemote?.result) return currentRemote.result

    const totalDocs = populatedDocsTotal ?? initialDocs.length
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
    return {
      docs: initialDocs,
      totalDocs,
      page: 1,
      totalPages,
      hasPrevPage: false,
      hasNextPage: totalPages > 1,
      prevPage: null,
      nextPage: totalPages > 1 ? 2 : null,
    }
  }, [
    archiveCategoryKey,
    categoryKey,
    currentRemote,
    initialDocs,
    isSelection,
    limit,
    localDocs,
    page,
    populatedDocsTotal,
    sort,
  ])

  useEffect(() => {
    if (!isLoading && !error) onResultChange?.(results)
  }, [error, isLoading, onResultChange, results])

  return (
    <div
      className={[classes.collectionArchive, className].filter(Boolean).join(' ')}
      aria-busy={isLoading}
    >
      {error && <div role="alert">{error}</div>}
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
        {results.docs.map(result => (
          <Card key={result.id} relationTo="products" doc={result} showCategories />
        ))}
      </div>
      {results.totalPages > 1 && (
        <Pagination
          className={classes.pagination}
          page={results.page}
          totalPages={results.totalPages}
          onClick={nextPage => setPagination({ filterKey, page: nextPage })}
        />
      )}
    </div>
  )
}
