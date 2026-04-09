'use client'

import React, { useEffect, useRef } from 'react'

import { getMediaURL } from '../../../_utilities/getServerURL'
import { Props as MediaProps } from '../types'

import classes from './index.module.scss'

export const Video: React.FC<MediaProps> = props => {
  const { videoClassName, resource, onClick } = props

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const { current: video } = videoRef
    if (video) {
      video.addEventListener('suspend', () => {})
    }
  }, [])

  if (resource && typeof resource !== 'string') {
    const { filename } = resource

    return (
      <video
        playsInline
        autoPlay
        muted
        loop
        controls={false}
        className={[classes.video, videoClassName].filter(Boolean).join(' ')}
        onClick={onClick}
        ref={videoRef}
      >
        <source src={getMediaURL(filename)} />
      </video>
    )
  }

  return null
}
