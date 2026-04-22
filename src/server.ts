import dotenv from 'dotenv'
import express from 'express'
import next from 'next'
import nextBuild from 'next/dist/build'
import path from 'path'
import payload from 'payload'

import { seed } from './payload/seed'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env') })
}

const app = express()
const PORT = Number(process.env.PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'

// Inject CSP header before anything else
app.use((req, res, nextMiddleware) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https:; object-src 'none'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src *",
  )
  nextMiddleware()
})

app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' })
})

const start = async (): Promise<void> => {
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
    app.listen(PORT, HOST, async () => {
      payload.logger.info('Next.js is now building...')
      // @ts-expect-error
      await nextBuild(path.join(__dirname, '../'))
      process.exit()
    })
    return
  }

  const nextApp = next({
    dev: process.env.NODE_ENV !== 'production',
  })

  const nextHandler = nextApp.getRequestHandler()

  app.use(express.static(path.resolve(__dirname, '../public')))
  app.use('/media', express.static(path.resolve(__dirname, './media')))
  app.use('/_next', express.static(path.resolve(__dirname, '../.next')))

  app.use((req, res) => nextHandler(req, res))

  nextApp.prepare().then(() => {
    payload.logger.info('Starting Next.js...')
    app.listen(PORT, HOST, async () => {
      payload.logger.info(`Next.js App URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL}`)
      payload.logger.info(`Listening on http://${HOST}:${PORT}`)
    })
  })
}

start()