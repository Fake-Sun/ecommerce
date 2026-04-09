import React from 'react'
import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import type { Product } from '../../../../payload/payload-types'
import { fetchDoc } from '../../../_api/fetchDoc'
import { Blocks } from '../../../_components/Blocks'
import { PaywallBlocks } from '../../../_components/PaywallBlocks'
import { ProductHero } from '../../../_heros/Product'
import { generateMeta } from '../../../_utilities/generateMeta'

interface ProductPageProps {
  params: { slug: string }
}

export default async function Product({ params }: ProductPageProps) {
  const { slug } = params
  const { isEnabled: isDraftMode } = await draftMode()

  let product: Product | null = null

  try {
    product = await fetchDoc<Product>({
      collection: 'products',
      slug,
      draft: isDraftMode,
    })
  } catch (error) {
    console.error(error)
  }

  if (!product) {
    notFound()
  }

  const { relatedProducts } = product

  return (
    <>
      <ProductHero product={product} />
      {product.enablePaywall && <PaywallBlocks productSlug={slug} disableTopPadding />}
      <Blocks
        disableTopPadding
        blocks={[
          {
            blockType: 'relatedProducts',
            blockName: 'Related Product',
            relationTo: 'products',
            introContent: [
              {
                type: 'h3',
                children: [{ text: 'Related Products' }],
              },
            ],
            docs: relatedProducts,
          },
        ]}
      />
    </>
  )
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const { slug } = params
  const { isEnabled: isDraftMode } = await draftMode()

  let product: Product | null = null

  try {
    product = await fetchDoc<Product>({
      collection: 'products',
      slug,
      draft: isDraftMode,
    })
  } catch (error) {
    console.error(error)
  }

  if (!product) {
    return {
      title: `Product Not Found`,
      description: `The requested product does not exist.`,
    }
  }

  return generateMeta({ doc: product })
}
