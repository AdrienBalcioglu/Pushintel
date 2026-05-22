import { Router } from 'express'
import { z } from 'zod'
import type { TokenService } from '../../tokens/token.service'
import type { PushService } from '../../push/push.service'
import type { Platform } from '@prisma/client'

const registerSchema = z.object({
  userId: z.string().min(1),
  token: z.string().min(1),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  tags: z.array(z.string()).optional(),
})

const sendSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  segment: z.string().default('all'),
  data: z.record(z.string(), z.string()).optional(),
})

export function createRegisterRouter(tokenService: TokenService, pushService: PushService): Router {
  const router = Router()

  router.post('/send', async (req, res) => {
    try {
      const body = sendSchema.parse(req.body)
      const result = await pushService.sendToSegment(body.segment, {
        title: body.title,
        body: body.body,
        data: body.data,
      })
      res.json({
        campaignId: result.campaignId,
        queued: result.queued,
        estimatedDelivery: new Date(Date.now() + 5000).toISOString(),
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', code: 'INVALID_INPUT', details: err.issues })
        return
      }
      const msg = err instanceof Error ? err.message : 'Internal error'
      res.status(500).json({ error: msg, code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/register', async (req, res) => {
    try {
      const body = registerSchema.parse(req.body)
      const device = await tokenService.register({
        userId: body.userId,
        token: body.token,
        platform: body.platform as Platform,
        tags: body.tags,
      })
      res.status(201).json({ id: device.id, token: device.token })
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
