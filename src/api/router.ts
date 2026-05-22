import { Router } from 'express'
import type { Container } from '../container/ioc'
import { createMcpAuthMiddleware } from '../mcp/middleware/auth'
import { mcpRateLimiter } from '../mcp/middleware/rate-limit'
import { createRegisterRouter } from './sdk/register.router'
import { createTokensRouter } from './admin/tokens.router'
import { createSegmentsRouter } from './admin/segments.router'
import { createAnalyticsRouter } from './admin/analytics.router'
import { createDashboardApiRouter } from './admin/dashboard.router'

export function createRouter(container: Container): Router {
  const router = Router()

  const authMiddleware = createMcpAuthMiddleware(
    container.apikeyService,
    container.blacklistService,
  )

  router.use('/sdk', authMiddleware, mcpRateLimiter, createRegisterRouter(container.tokenService, container.pushService))

  router.use(
    '/admin/tokens',
    authMiddleware,
    mcpRateLimiter,
    createTokensRouter(container.apikeyService, container.blacklistService, container.jwtService),
  )

  router.use(
    '/admin/segments',
    authMiddleware,
    mcpRateLimiter,
    createSegmentsRouter(container.segmentService),
  )

  router.use(
    '/admin/dashboard',
    authMiddleware,
    mcpRateLimiter,
    createDashboardApiRouter(container.prisma),
  )

  router.use(
    '/admin/analytics',
    authMiddleware,
    mcpRateLimiter,
    createAnalyticsRouter(container.analyticsService),
  )

  return router
}
