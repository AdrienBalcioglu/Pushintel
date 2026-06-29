import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import IORedis from 'ioredis'
import { config } from '../../config/env'

// Lazy redis client for the rate limiter (separate from the container's redis)
let redisClient: IORedis | null = null

function getRedisClient(): IORedis {
  if (!redisClient) {
    redisClient = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null })
  }
  return redisClient
}

// rate-limit-redis expects SendCommandFn (command: string, ...args: string[]) => Promise<RedisReply>
// ioredis.call() is the same interface but infers Promise<unknown> — bridge via a wrapper
const redisStore = new RedisStore({
  sendCommand: (...args: string[]) => getRedisClient().call(args[0]!, ...args.slice(1)),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

export const mcpRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  keyGenerator: (req) => req.apiKey?.id ?? 'anonymous',
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore,
  message: { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
})