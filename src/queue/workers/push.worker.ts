import 'dotenv/config'
import { Worker } from 'bullmq'
import { redisConnection, PUSH_QUEUE_NAME } from '../bull.config'
import { buildWorkerContainer, disposeInfrastructure } from '../../container/ioc'
import type { PushJobData } from '../push.queue'

const { logger, prisma, gatewayFactory } = buildWorkerContainer('push-worker')

const worker = new Worker<PushJobData>(
  PUSH_QUEUE_NAME,
  async (job) => {
    const { token, platform, notification, campaignId } = job.data
    const gateway = gatewayFactory.create(platform, token)
    const result = await gateway.send(token, notification)

    await prisma.deliveryEvent.create({
      data: {
        campaignId,
        deviceToken: token,
        platform,
        status: result.success ? 'SENT' : 'FAILED',
        error: result.error,
      },
    })

    if (!result.success && result.invalidToken) {
      await prisma.deviceToken.updateMany({
        where: { token },
        data: { active: false },
      })
      logger.info({ token }, 'deactivated invalid device token')
    }

    if (!result.success && !result.invalidToken) {
      throw new Error(result.error ?? 'Push delivery failed')
    }
  },
  { connection: redisConnection, concurrency: 50 },
)

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'push job permanently failed')
})

worker.on('error', (err) => {
  logger.error({ err }, 'worker error')
})

async function shutdown(): Promise<void> {
  logger.info('Push worker shutting down...')
  await worker.close()
  await disposeInfrastructure()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

logger.info('Push worker started')