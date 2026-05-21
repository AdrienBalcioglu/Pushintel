import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { buildContainer } from './container/ioc'
import { createRouter } from './api/router'
import { registerTools } from './mcp/tools/index'
import { PushintelMCPServer } from './mcp/server'
import { config } from './config/env'

async function main(): Promise<void> {
  const container = buildContainer()
  const { logger, prisma } = container

  await prisma.$connect()
  logger.info('Database connected')

  const app = express()
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.use('/api', createRouter(container))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' })
  })

  const tools = registerTools(
    container.pushService,
    container.segmentService,
    container.analyticsService,
  )

  const mcpServer = new PushintelMCPServer(tools, logger)

  if (config.NODE_ENV !== 'production') {
    await mcpServer.connectStdio()
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
