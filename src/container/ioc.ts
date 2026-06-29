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
  shutdown: () => Promise<void>
}

// Shared infrastructure singletons (lazy-initialized)
let _prisma: PrismaClient | null = null
let _redis: IORedis | null = null
let _firebaseApp: ReturnType<typeof initFirebase> | undefined = undefined

function getPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient()
  return _prisma
}

function getRedis(): IORedis {
  if (!_redis) _redis = new IORedis(config.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null })
  return _redis
}

function getFirebaseApp() {
  if (_firebaseApp === undefined) _firebaseApp = initFirebase()
  return _firebaseApp
}

function buildGatewayFactory(logger: Logger): GatewayFactory {
  const fcmGateway = new FCMGateway(getFirebaseApp())
  const apnsGateway = new APNsGateway()
  return new GatewayFactory(fcmGateway, apnsGateway, logger)
}

function buildServices(prisma: PrismaClient, _logger: Logger) {
  const tokenRepo = new TokenRepository(prisma)
  const tokenService = new TokenService(tokenRepo)

  const segmentRepo = new SegmentRepository(prisma)
  const segmentService = new SegmentService(segmentRepo, tokenService)

  const deliveryRepo = new DeliveryRepository(prisma)
  const analyticsService = new AnalyticsService(prisma, deliveryRepo)

  const pushService = new PushService(prisma, pushQueue, segmentService)

  return { tokenService, segmentService, analyticsService, pushService }
}

export function buildContainer(): Container {
  const logger: Logger = pino({
    name: 'pushintel',
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    ...(config.NODE_ENV !== 'production' && {
      transport: { target: 'pino-pretty' },
    }),
  })

  const prisma = getPrisma()
  const redis = getRedis()
  const gatewayFactory = buildGatewayFactory(logger)
  const { tokenService, segmentService, analyticsService, pushService } = buildServices(prisma, logger)

  const blacklistService = new BlacklistService(redis)
  const apikeyService = new ApiKeyService(prisma)
  const jwtService = new JwtService()

  const discord = config.DISCORD_WEBHOOK_URL ? new DiscordWebhook(config.DISCORD_WEBHOOK_URL) : null

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down container...')
    await prisma.$disconnect()
    redis.disconnect()
    _prisma = null
    _redis = null
    logger.info('Container shut down')
  }

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
    shutdown,
  }
}

/** Lightweight container for BullMQ workers — reuses shared singletons */
export interface WorkerContainer {
  logger: Logger
  prisma: PrismaClient
  gatewayFactory: GatewayFactory
}

export function buildWorkerContainer(workerName: string): WorkerContainer {
  const logger = pino({ name: workerName })
  const prisma = getPrisma()
  const gatewayFactory = buildGatewayFactory(logger)
  return { logger, prisma, gatewayFactory }
}

/** Cleanup shared resources (called once on process exit) */
export async function disposeInfrastructure(): Promise<void> {
  if (_prisma) await _prisma.$disconnect()
  if (_redis) _redis.disconnect()
  _prisma = null
  _redis = null
}
