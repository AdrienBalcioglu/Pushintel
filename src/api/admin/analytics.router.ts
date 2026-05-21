import { Router } from 'express'
import type { AnalyticsService } from '../../analytics/analytics.service'
import { requireRole } from '../../auth/rbac.middleware'

export function createAnalyticsRouter(analyticsService: AnalyticsService): Router {
  const router = Router()

  router.get('/campaigns/:id/stats', requireRole('VIEWER'), async (req, res) => {
    try {
      const id = req.params['id'] as string
      const stats = await analyticsService.getCampaignStats(id)
      res.json(stats)
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        res.status(404).json({ error: err.message, code: 'NOT_FOUND' })
        return
      }
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  })

  return router
}
