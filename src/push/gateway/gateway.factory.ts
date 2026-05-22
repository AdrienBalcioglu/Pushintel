import type { Logger } from 'pino'
import type { PushGateway } from './base.gateway'
import type { Platform } from '../push.types'
import { RetryGateway } from './retry.gateway'
import { LoggingGateway } from './logging.gateway'
import { ExpoGateway } from './expo.gateway'

const expoGateway = new ExpoGateway()

export class GatewayFactory {
  constructor(
    private fcmGateway: PushGateway,
    private apnsGateway: PushGateway,
    private logger: Logger,
  ) {}

  create(platform: Platform, token?: string): PushGateway {
    // Expo push tokens sont routés vers l'API Expo quel que soit la platform
    if (token?.startsWith('ExponentPushToken')) {
      return new LoggingGateway(new RetryGateway(expoGateway), this.logger)
    }
    const base = platform === 'IOS' ? this.apnsGateway : this.fcmGateway
    return new LoggingGateway(new RetryGateway(base), this.logger)
  }
}
