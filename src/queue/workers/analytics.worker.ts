import { Worker } from 'bullmq'
import pino from 'pino'
import { redisConnection, ANALYTICS_QUEUE_NAME } from '../bull.config'
import { DiscordWebhook } from '../../analytics/discord.webhook'
import { config } from '../../config/env'

const logger = pino({ name: 'analytics-worker' })
const discord = config.DISCORD_WEBHOOK_URL ? new DiscordWebhook(config.DISCORD_WEBHOOK_URL) : null

export interface AnalyticsJobData {
  campaignId: string
  sent: number
  delivered: number
  failed: number
  opened: number
}

const worker = new Worker<AnalyticsJobData>(
  ANALYTICS_QUEUE_NAME,
  async (job) => {
    if (!discord) return
    await discord.sendCampaignReport(job.data)
  },
  { connection: redisConnection, concurrency: 5 },
)

worker.on('error', (err) => {
  logger.error({ err }, 'analytics worker error')
})

logger.info('Analytics worker started')
