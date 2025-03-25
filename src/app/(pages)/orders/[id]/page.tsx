import React, { Fragment } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { Order } from '../../../../payload/payload-types'
import { Button } from '../../../_components/Button'
import { Gutter } from '../../../_components/Gutter'
import { HR } from '../../../_components/HR'
import { Media } from '../../../_components/Media'
import { Price } from '../../../_components/Price'
import { formatDateTime } from '../../../_utilities/formatDateTime'
import { getMeUser } from '../../../_utilities/getMeUser'
import { mergeOpenGraph } from '../../../_utilities/mergeOpenGraph'

import classes from './index.module.scss'

export const dynamic = 'force-dynamic'

export default async function Order({ params }: { params: { id: string } }) {
  const { token } = await getMeUser({
    nullUserRedirect: `/login?error=${encodeURIComponent(
      'You must be logged in to view this order.',
    )}&redirect=${encodeURIComponent(`/orders/${params.id}`)}`,
  })

  let order: Order | null = null

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/orders/${params.id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${token}`,
      },
    })

    const json = await res.json()
    if (!res.ok || json?.error || json?.errors) notFound()
    order = json
  } catch {
    notFound()
  }

  if (!order) {
    notFound()
  }

  return (
    <Gutter className={classes.orders}>
      <h1>
        Order <span className={classes.id}>{order.id}</span>
      </h1>
      <div className={classes.itemMeta}>
        <p>{`ID: ${order.id}`}</p>
        <p>{`Payment Intent: ${order.stripePaymentIntentID}`}</p>
        <p>{`Ordered On: ${formatDateTime(order.createdAt)}`}</p>
        <p className={classes.total}>
          Total:{' '}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'usd',
          }).format(order.total / 100)}
        </p>
      </div>
      <HR />
      <div className={classes.order}>
        <h4 className={classes.orderItems}>Items</h4>
        {order.items?.map((item, index) => {
          if (typeof item.product === 'object') {
            const { quantity, product } = item
            const isLast = index === (order.items?.length || 0) - 1
            const metaImage = product.meta?.image

            return (
              <Fragment key={index}>
                <div className={classes.row}>
                  <a href={`/products/${product.slug}`} className={classes.mediaWrapper}>
                    {!metaImage && <span className={classes.placeholder}>No image</span>}
                    {metaImage && typeof metaImage !== 'string' && (
                      <Media
                        className={classes.media}
                        imgClassName={classes.image}
                        resource={metaImage}
                        fill
                      />
                    )}
                  </a>
                  <div className={classes.rowContent}>
                    {!product.stripeProductID && (
                      <p className={classes.warning}>
                        This product is not yet connected to Stripe. To link this product,{' '}
                        <a
                          href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/products/${product.id}`}
                        >
                          edit this product in the admin panel
                        </a>
                        .
                      </p>
                    )}
                    <h5 className={classes.title}>
                      <a href={`/products/${product.slug}`} className={classes.titleLink}>
                        {product.title}
                      </a>
                    </h5>
                    <p>{`Quantity: ${quantity}`}</p>
                    <Price product={product} button={false} quantity={quantity} />
                  </div>
                </div>
                {!isLast && <HR />}
              </Fragment>
            )
          }
          return null
        })}
      </div>
      <HR />
      <div className={classes.actions}>
        <Button href="/orders" appearance="primary" label="See all orders" />
        <Button href="/account" appearance="secondary" label="Go to account" />
      </div>
    </Gutter>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Order ${params.id}`,
    description: `Order details for order ${params.id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${params.id}`,
      url: `/orders/${params.id}`,
    }),
  }
}
