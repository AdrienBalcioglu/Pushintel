import { ConnectionOptions } from 'bullmq'
import { config } from '../config/env'

const url = new URL(config.REDIS_URL ?? 'redis://localhost:6379')

export const redisConnection: ConnectionOptions = {
  host: url.hostname,
  port: parseInt(url.port || '6379', 10),
  password: url.password || undefined,
}

export const PUSH_QUEUE_NAME = 'push-notifications'
export const ANALYTICS_QUEUE_NAME = 'analytics-events'
