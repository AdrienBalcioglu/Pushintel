import { Queue } from 'bullmq'
import { redisConnection, PUSH_QUEUE_NAME } from './bull.config'
import type { Platform } from '../push/push.types'
import type { Notification } from '../push/push.types'

export interface PushJobData {
  token: string
  platform: Platform
  notification: Notification
  campaignId: string
}

export const pushQueue = new Queue<PushJobData>(PUSH_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})
