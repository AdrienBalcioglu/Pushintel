import { Worker } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import pino from 'pino'
import { redisConnection, PUSH_QUEUE_NAME } from '../bull.config'
import { GatewayFactory } from '../../push/gateway/gateway.factory'
import { FCMGateway } from '../../push/gateway/fcm.gateway'
import { APNsGateway } from '../../push/gateway/apns.gateway'
import type { PushJobData } from '../push.queue'
import { initFirebase } from '../../container/firebase'

const logger = pino({ name: 'push-worker' })
const prisma = new PrismaClient()
const firebaseApp = initFirebase()
const factory = new GatewayFactory(new FCMGateway(firebaseApp), new APNsGateway(), logger)

const worker = new Worker<PushJobData>(
  PUSH_QUEUE_NAME,
  async (job) => {
    const { token, platform, notification, campaignId } = job.data
    const gateway = factory.create(platform)
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

logger.info('Push worker started')
