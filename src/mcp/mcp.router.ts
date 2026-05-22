import { Router } from 'express'
import type { Logger } from 'pino'
import type { Container } from '../container/ioc'
import { registerTools } from './tools/index'
import { PushintelMCPServer } from './server'
import { mountSseTransport } from './transport/sse'
import { mountHttpTransport } from './transport/http'
import { createMcpAuthMiddleware } from './middleware/auth'
import { mcpRateLimiter } from './middleware/rate-limit'

export function createMcpRouter(container: Container, logger: Logger): Router {
  const router = Router()

  const tools = registerTools(
    container.pushService,
    container.segmentService,
    container.analyticsService,
  )
  const mcpServer = new PushintelMCPServer(tools, logger)

  const authMiddleware = createMcpAuthMiddleware(
    container.apikeyService,
    container.blacklistService,
  )

  // Auth + rate limit on all /mcp routes
  router.use(authMiddleware)
  router.use(mcpRateLimiter)

  // SSE transport  — Claude connects via GET /mcp/sse
  // HTTP Streamable — Claude connects via POST /mcp/http
  mountSseTransport(router, mcpServer, logger)
  mountHttpTransport(router, mcpServer, logger)

  // Info endpoint — useful to verify the server is reachable
  router.get('/', (_req, res) => {
    res.json({
      name: 'pushintel',
      version: '1.0.0',
      transports: ['sse', 'http-streamable'],
      tools: tools.map((t) => ({ name: t.name, description: t.description })),
    })
  })

  return router
}
