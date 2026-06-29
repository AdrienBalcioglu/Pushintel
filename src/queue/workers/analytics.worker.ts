import 'dotenv/config'
import { Worker } from 'bullmq'
import { redisConnection, ANALYTICS_QUEUE_NAME } from '../bull.config'
import { disposeInfrastructure } from '../../container/ioc'
import { DiscordWebhook } from '../../analytics/discord.webhook'
import { config } from '../../config/env'
import pino from 'pino'

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

async function shutdown(): Promise<void> {
  logger.info('Analytics worker shutting down...')
  await worker.close()
  await disposeInfrastructure()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

logger.info('Analytics worker started')