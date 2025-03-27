'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { Message } from '../Message'

import classes from './index.module.scss'

export type Props = {
  params?: string[]
  message?: string
  className?: string
  onParams?: (paramValues: ((string | null | undefined) | string[])[]) => void
}

export const RenderParamsComponent: React.FC<Props> = ({
  params = ['error', 'warning', 'success', 'message'],
  className,
  onParams,
}) => {
  const searchParams = useSearchParams()

  const paramValues = useMemo(() => {
    return params.map(param => searchParams.get(param))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, params.join(',')]) // join array for stable dependency

  const [values, setValues] = useState<(string | null)[]>([])

  useEffect(() => {
    setValues(paramValues)
    if (onParams) onParams(paramValues)
  }, [paramValues, onParams])

  if (!values.length || values.every(v => !v)) return null

  return (
    <div className={className}>
      {values.map((paramValue, index) => {
        if (!paramValue) return null

        return (
          <Message
            className={classes.renderParams}
            key={`${params[index]}-${paramValue}`}
            {...{
              [params[index]]: paramValue,
            }}
          />
        )
      })}
    </div>
  )
}
