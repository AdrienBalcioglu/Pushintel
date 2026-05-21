import { Router } from 'express'
import { z } from 'zod'
import type { SegmentService } from '../../segments/segment.service'
import { requireRole } from '../../auth/rbac.middleware'

const createSegmentSchema = z.object({
  name: z.string().min(1),
  filters: z.object({
    platform: z.enum(['IOS', 'ANDROID', 'WEB']).optional(),
    tags: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
  }),
})

export function createSegmentsRouter(segmentService: SegmentService): Router {
  const router = Router()

  router.get('/', requireRole('VIEWER'), async (_req, res) => {
    const segments = await segmentService.listWithCounts()
    res.json({ segments })
  })

  router.post('/', requireRole('ADMIN'), async (req, res) => {
    try {
      const body = createSegmentSchema.parse(req.body)
      const segment = await segmentService.create(body.name, body.filters)
      res.status(201).json(segment)
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', code: 'INVALID_INPUT', details: err.issues })
        return
      }
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  })

  return router
}
