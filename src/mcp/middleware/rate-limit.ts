import rateLimit from 'express-rate-limit'
import { config } from '../../config/env'

export const mcpRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  keyGenerator: (req) => req.apiKey?.id ?? 'anonymous',
  validate: { xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
})
