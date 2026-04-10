'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { Button } from '../../../_components/Button'
import { Message } from '../../../_components/Message'
import { useCart } from '../../../_providers/Cart'

import classes from './index.module.scss'

export const OrderConfirmationPage: React.FC = () => {
  const searchParamsHook = useSearchParams()
  const [orderID, setOrderID] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { clearCart } = useCart()

  useEffect(() => {
    setOrderID(searchParamsHook.get('order_id'))
    setError(searchParamsHook.get('error'))
    clearCart()
  }, [searchParamsHook, clearCart])

  return (
    <div>
      {error ? (
        <Fragment>
          <Message error={error} />
          <p>
            Your payment was successful but there was an error processing your order. Please contact
            us to resolve this issue.
          </p>
          <div className={classes.actions}>
            <Button href="/account" label="View account" appearance="primary" />
            <Button href={'/orders'} label="View all orders" appearance="secondary" />
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <h1>Thank you for your order!</h1>
          <p>
            Your order has been confirmed. You will receive an email confirmation shortly.
            {orderID}.
          </p>
          <div className={classes.actions}>
            <Button href={`/account/orders/${orderID}`} label="View order" appearance="primary" />
            <Button href={'/account/orders'} label="View all orders" appearance="secondary" />
          </div>
        </Fragment>
      )}
    </div>
  )
}
