import dotenv from 'dotenv'
import express from 'express'
import next from 'next'
import nextBuild from 'next/dist/build'
import path from 'path'
import payload from 'payload'

import { seed } from './payload/seed'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

const app = express()
const PORT = process.env.PORT || 3000

const start = async (): Promise<void> => {
  // Skip everything if building Docker image
  if (process.env.PAYLOAD_BUILD === 'true') {
    console.log('[INFO] Skipping Payload init during Docker build.')
    return
  }

  await payload.init({
    secret: process.env.PAYLOAD_SECRET || '',
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  if (process.env.PAYLOAD_SEED === 'true') {
    await seed(payload)
    process.exit()
  }

  if (process.env.NEXT_BUILD) {
    app.listen(PORT, async () => {
      payload.logger.info(`Next.js is now building...`)
      // @ts-expect-error
      await nextBuild(path.join(__dirname, '../'))
      process.exit()
    })
    return
  }

  const nextApp = next({
    dev: process.env.NODE_ENV !== 'production',
  })

  app.use('/media', express.static(path.resolve(__dirname, './media')))

  const nextHandler = nextApp.getRequestHandler()

  // Serve static files (like .svg) from public/
  app.use(express.static(path.resolve(__dirname, '../public')))

  // Serve uploaded media files from media/
  app.use('/media', express.static(path.resolve(__dirname, './media')))

  app.use('/_next', express.static(path.resolve(__dirname, '../.next')))

  // Next.js pages and API routes
  app.use((req, res) => nextHandler(req, res))

  nextApp.prepare().then(() => {
    payload.logger.info('Starting Next.js...')

    app.listen(PORT, async () => {
      payload.logger.info(`Next.js App URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL}`)
    })
  })
}

start()
