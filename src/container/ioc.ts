import { PrismaClient } from '@prisma/client'
import IORedis from 'ioredis'
import pino, { type Logger } from 'pino'
import { config } from '../config/env'
import { initFirebase } from './firebase'
import { FCMGateway } from '../push/gateway/fcm.gateway'
import { APNsGateway } from '../push/gateway/apns.gateway'
import { GatewayFactory } from '../push/gateway/gateway.factory'
import { TokenRepository } from '../tokens/token.repository'
import { TokenService } from '../tokens/token.service'
import { SegmentRepository } from '../segments/segment.repository'
import { SegmentService } from '../segments/segment.service'
import { DeliveryRepository } from '../analytics/delivery.repository'
import { AnalyticsService } from '../analytics/analytics.service'
import { PushService } from '../push/push.service'
import { BlacklistService } from '../auth/blacklist.service'
import { ApiKeyService } from '../auth/apikey.service'
import { JwtService } from '../auth/jwt.service'
import { pushQueue } from '../queue/push.queue'
import { DiscordWebhook } from '../analytics/discord.webhook'

export interface Container {
  logger: Logger
  prisma: PrismaClient
  redis: IORedis
  gatewayFactory: GatewayFactory
  tokenService: TokenService
  segmentService: SegmentService
  analyticsService: AnalyticsService
  pushService: PushService
  blacklistService: BlacklistService
  apikeyService: ApiKeyService
  jwtService: JwtService
  discord: DiscordWebhook | null
}

export function buildContainer(): Container {
  const logger: Logger = pino({
    name: 'pushintel',
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    ...(config.NODE_ENV !== 'production' && {
      transport: { target: 'pino-pretty' },
    }),
  })

  const prisma = new PrismaClient()
  const redis = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null })

  const firebaseApp = initFirebase()
  const fcmGateway = new FCMGateway(firebaseApp)
  const apnsGateway = new APNsGateway()
  const gatewayFactory = new GatewayFactory(fcmGateway, apnsGateway, logger)

  const tokenRepo = new TokenRepository(prisma)
  const tokenService = new TokenService(tokenRepo)

  const segmentRepo = new SegmentRepository(prisma)
  const segmentService = new SegmentService(segmentRepo, tokenService)

  const deliveryRepo = new DeliveryRepository(prisma)
  const analyticsService = new AnalyticsService(prisma, deliveryRepo)

  const pushService = new PushService(prisma, pushQueue, segmentService)

  const blacklistService = new BlacklistService(redis)
  const apikeyService = new ApiKeyService(prisma)
  const jwtService = new JwtService()

  const discord = config.DISCORD_WEBHOOK_URL ? new DiscordWebhook(config.DISCORD_WEBHOOK_URL) : null

  return {
    logger,
    prisma,
    redis,
    gatewayFactory,
    tokenService,
    segmentService,
    analyticsService,
    pushService,
    blacklistService,
    apikeyService,
    jwtService,
    discord,
  }
}
