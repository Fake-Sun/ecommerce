import * as React from 'react'
import { Text, useFormFields } from 'payload/components/forms'
import CopyToClipboard from 'payload/dist/admin/components/elements/CopyToClipboard'
import { TextField } from 'payload/dist/fields/config/types'

export const LinkToPaymentIntent: React.FC<TextField> = props => {
  const { label } = props

  const { value: stripePaymentIntentID } = useFormFields(([fields]) => fields[props.name]) || {}
  const stripeDashboardPrefix =
    process.env.PAYLOAD_PUBLIC_STRIPE_IS_TEST_KEY === 'true' ? 'test/' : ''
  const href = `https://dashboard.stripe.com/${stripeDashboardPrefix}payments/${stripePaymentIntentID}`

  return (
    <div>
      <p style={{ marginBottom: '0' }}>
        {typeof label === 'string' ? label : 'Stripe Payment Intent ID'}
      </p>
      <Text {...props} label="" />
      {Boolean(stripePaymentIntentID) && (
        <div>
          <div>
            <span
              className="label"
              style={{
                color: '#9A9A9A',
              }}
            >
              {`Manage in Stripe`}
            </span>
            <CopyToClipboard value={href} />
          </div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: '600',
            }}
          >
            <a href={href} target="_blank" rel="noreferrer noopener">
              {href}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
