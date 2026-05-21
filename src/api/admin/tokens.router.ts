import { Router } from 'express'
import { z } from 'zod'
import type { ApiKeyService } from '../../auth/apikey.service'
import type { BlacklistService } from '../../auth/blacklist.service'
import type { JwtService } from '../../auth/jwt.service'
import { requireRole } from '../../auth/rbac.middleware'
import type { Role } from '@prisma/client'

const createKeySchema = z.object({
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'SENDER', 'VIEWER']),
})

export function createTokensRouter(
  apikeyService: ApiKeyService,
  blacklistService: BlacklistService,
  jwtService: JwtService,
): Router {
  const router = Router()

  router.post('/apikeys', requireRole('ADMIN'), async (req, res) => {
    try {
      const body = createKeySchema.parse(req.body)
      const { raw, id } = await apikeyService.generate(body.name, body.role as Role)
      res.status(201).json({ id, key: raw, note: 'Store this key — it will not be shown again' })
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', code: 'INVALID_INPUT', details: err.issues })
        return
      }
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  })

  router.delete('/apikeys/:id', requireRole('ADMIN'), async (req, res) => {
    await apikeyService.revoke(req.params['id'] as string)
    res.status(204).end()
  })

  router.post('/jwt', requireRole('ADMIN'), async (req, res) => {
    try {
      const { sub, role } = z.object({ sub: z.string(), role: z.string() }).parse(req.body)
      const token = await jwtService.sign({ sub, role })
      res.json({ token })
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', code: 'INVALID_INPUT', details: err.issues })
        return
      }
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' })
    }
  })

  router.post('/blacklist', requireRole('ADMIN'), async (req, res) => {
    const { token } = z.object({ token: z.string() }).parse(req.body)
    await blacklistService.add(token)
    res.status(204).end()
  })

  return router
}
