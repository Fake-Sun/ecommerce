'use client'
import React from 'react'
import Link from 'next/link'

import { Category, Media } from '../../../../payload/payload-types'
import { useFilter } from '../../../_providers/Filter'

import classes from './index.module.scss'

type CategoryCardProps = {
  category: Category
}

const CategoryCard = ({ category }: CategoryCardProps) => {
  const media = category?.media as Media | null
  const { setCategoryFilters } = useFilter()

  const backgroundImage = media?.url ? `url(${media.url})` : undefined

  return (
    <Link
      href="/products"
      className={classes.card}
      style={backgroundImage ? { backgroundImage } : {}}
      onClick={() => setCategoryFilters([category.id])}
    >
      <p className={classes.title}>{category.title}</p>
    </Link>
  )
}

export default CategoryCard
