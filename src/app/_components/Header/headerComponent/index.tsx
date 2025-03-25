'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Header } from '../../../../payload/payload-types'
import { noHeaderFooterUrls } from '../../../constants'
import { Gutter } from '../../Gutter'
import { HeaderNav } from '../Nav'

import classes from './index.module.scss'

export const HeaderComponent = ({ header }: { header: Header }) => {
  const pathname = usePathname()

  if (!header || !header.navItems) return null

  return (
    <nav
      className={[classes.header, noHeaderFooterUrls.includes(pathname) && classes.hide]
        .filter(Boolean)
        .join(' ')}
    >
      <Gutter className={classes.wrap}>
        <Link href="/">
          <Image
            src="/logo-black.svg"
            alt="Logo"
            width={170}
            height={50}
            style={{ height: 'auto' }}
          />
        </Link>

        <HeaderNav header={header} />
      </Gutter>
    </nav>
  )
}
