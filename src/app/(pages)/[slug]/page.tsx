import React from 'react'
import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import type { Category, Page } from '../../../payload/payload-types'
import { staticHome } from '../../../payload/seed/home-static'
import { fetchDoc } from '../../_api/fetchDoc'
import { fetchDocs } from '../../_api/fetchDocs'
import { Blocks } from '../../_components/Blocks'
import Categories from '../../_components/Categories'
import { Gutter } from '../../_components/Gutter'
import { Hero } from '../../_components/Hero'
import Promotion from '../../_components/Promotion'
import { generateMeta } from '../../_utilities/generateMeta'

import classes from './index.module.scss'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { slug: string } }) {
  const slug = params.slug ?? 'home'
  const { isEnabled: isDraftMode } = await draftMode()

  let page: Page | null = null
  let categories: Category[] | null = null

  try {
    page = await fetchDoc<Page>({
      collection: 'pages',
      slug,
      draft: isDraftMode,
    })

    categories = await fetchDocs<Category>('categories')
  } catch (error) {}

  if (!page && slug === 'home') {
    page = staticHome
  }

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  return (
    <React.Fragment>
      {slug === 'home' ? (
        <section>
          <Hero {...hero} />
          <Gutter className={classes.home}>
            <Categories categories={categories} />
            <Promotion />
          </Gutter>
        </section>
      ) : (
        <>
          <Hero {...hero} />
          <Blocks
            blocks={layout}
            disableTopPadding={!hero || hero?.type === 'none' || hero?.type === 'lowImpact'}
          />
        </>
      )}
    </React.Fragment>
  )
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const slug = params.slug ?? 'home'
  const { isEnabled: isDraftMode } = await draftMode()

  let page: Page | null = null

  try {
    page = await fetchDoc<Page>({
      collection: 'pages',
      slug,
      draft: isDraftMode,
    })
  } catch (err) {
    console.error(`[generateMetadata] fetchDoc error:`, err)
  }

  if (!page && slug === 'home') {
    page = staticHome
  }

  if (!page) {
    return {
      title: 'Page Not Found',
      description: 'The page could not be found.',
    }
  }

  return generateMeta({ doc: page })
}
