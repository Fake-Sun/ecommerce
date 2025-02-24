import React from 'react'
import Link from 'next/link'

import { Category } from '../../../../payload/payload-types'

import classes from './index.module.scss'

type CategoryCardProps = {
  category: Category
}

const CategoryCard = ({ category }: CategoryCardProps) => {

  
  return (
    <Link href="/products" className={classes.card}>
      <p className={classes.title}>{category.title}</p>
    </Link>
  )
}
export default CategoryCard
