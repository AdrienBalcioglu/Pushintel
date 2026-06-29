import type { Logger } from 'pino'
import type { PushGateway } from './base.gateway'
import type { Platform } from '../push.types'
import { RetryGateway } from './retry.gateway'
import { LoggingGateway } from './logging.gateway'
import { ExpoGateway } from './expo.gateway'

export class GatewayFactory {
  private expoGateway: ExpoGateway | null = null

  constructor(
    private fcmGateway: PushGateway,
    private apnsGateway: PushGateway,
    private logger: Logger,
  ) {}

  create(platform: Platform, token?: string): PushGateway {
    // Expo push tokens sont routés vers l'API Expo quel que soit la platform
    if (token?.startsWith('ExponentPushToken')) {
      if (!this.expoGateway) {
        this.expoGateway = new ExpoGateway()
      }
      return new LoggingGateway(new RetryGateway(this.expoGateway), this.logger)
    }
    const base = platform === 'IOS' ? this.apnsGateway : this.fcmGateway
    return new LoggingGateway(new RetryGateway(base), this.logger)
  }
}