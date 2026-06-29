import { ConnectionOptions } from 'bullmq'
import { config } from '../config/env'

function parseRedisUrl(raw: string | undefined): { host: string; port: number; password?: string } {
  if (!raw) {
    return { host: 'localhost', port: 6379 }
  }
  try {
    const url = new URL(raw)
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
    }
  } catch {
    console.error(`⚠️  Invalid REDIS_URL "${raw}" — using localhost:6379`)
    return { host: 'localhost', port: 6379 }
  }
}

const redisParsed = parseRedisUrl(config.REDIS_URL)

export const redisConnection: ConnectionOptions = {
  host: redisParsed.host,
  port: redisParsed.port,
  password: redisParsed.password,
}

export const PUSH_QUEUE_NAME = 'push-notifications'
export const ANALYTICS_QUEUE_NAME = 'analytics-events'