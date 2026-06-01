import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { buildContainer } from './container/ioc'
import { createRouter } from './api/router'
import { createMcpRouter } from './mcp/mcp.router'
import { config } from './config/env'

async function main(): Promise<void> {
  const container = buildContainer()
  const { logger, prisma } = container

  await prisma.$connect()
  logger.info('Database connected')

  const app = express()
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.tailwindcss.com',
            'https://cdn.jsdelivr.net',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
          connectSrc: ["'self'", 'http://localhost:3000'],
          imgSrc: ["'self'", 'data:'],
        },
      },
    }),
  )
  app.use(cors())
  app.use(express.json())

  app.use('/api', createRouter(container))
  app.use('/mcp', createMcpRouter(container, logger))
  app.use('/dashboard', express.static(path.join(__dirname, '..', 'dashboard')))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' })
  })

  if (config.NODE_ENV !== 'production') {
    // stdio kept for local Claude Desktop integration
    const { registerTools } = await import('./mcp/tools/index')
    const { PushintelMCPServer } = await import('./mcp/server')
    const tools = registerTools(container.pushService, container.segmentService, container.analyticsService)
    await new PushintelMCPServer(tools, logger).connectStdio()
  }

  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'Pushintel server started')
  })

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down...')
    await prisma.$disconnect()
    container.redis.disconnect()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`)
  process.exit(1)
})
