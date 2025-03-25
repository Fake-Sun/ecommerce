'use client'

import React, { useEffect, useState } from 'react'
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
  const [paramValues, setParamValues] = useState<(string | null)[]>([])

  useEffect(() => {
    if (searchParams) {
      const values = params.map(param => searchParams.get(param))
      setParamValues(values)
      if (onParams) {
        onParams(values)
      }
    }
  }, [searchParams, params, onParams])

  if (!paramValues.length || paramValues.every(v => !v)) return null

  return (
    <div className={className}>
      {paramValues.map((paramValue, index) => {
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
