import type { Request, Response, NextFunction } from 'express'
import type { ApiKeyService } from '../../auth/apikey.service'
import type { BlacklistService } from '../../auth/blacklist.service'
import type { Role } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      apiKey?: { id: string; role: Role }
    }
  }
}

export function createMcpAuthMiddleware(
  apikeyService: ApiKeyService,
  blacklistService: BlacklistService,
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const raw = req.headers['x-api-key']
    if (!raw || typeof raw !== 'string') {
      res.status(401).json({ error: 'Missing API key', code: 'MISSING_API_KEY' })
      return
    }

    const isBlacklisted = await blacklistService.isBlacklisted(raw)
    if (isBlacklisted) {
      res.status(401).json({ error: 'Revoked key', code: 'REVOKED_KEY' })
      return
    }

    const apiKey = await apikeyService.verify(raw)
    if (!apiKey) {
      res.status(401).json({ error: 'Invalid API key', code: 'INVALID_API_KEY' })
      return
    }

    req.apiKey = apiKey
    next()
  }
}
