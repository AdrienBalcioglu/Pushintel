import { Router } from 'express'
import { z } from 'zod'
import type { TokenService } from '../../tokens/token.service'
import type { Platform } from '@prisma/client'

const registerSchema = z.object({
  userId: z.string().min(1),
  token: z.string().min(1),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  tags: z.array(z.string()).optional(),
})

export function createRegisterRouter(tokenService: TokenService): Router {
  const router = Router()

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
