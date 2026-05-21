import type { Request, Response, NextFunction } from 'express'
import type { Role } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      apiKey?: { id: string; role: Role }
    }
  }
}

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  SENDER: 2,
  VIEWER: 1,
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.apiKey
    if (!apiKey) {
      res.status(401).json({ error: 'Unauthorized', code: 'MISSING_AUTH' })
      return
    }

    const hasPermission = roles.some(
      (r) => ROLE_HIERARCHY[apiKey.role] >= ROLE_HIERARCHY[r],
    )

    if (!hasPermission) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_ROLE',
        details: { required: roles, current: apiKey.role },
      })
      return
    }

    next()
  }
}
