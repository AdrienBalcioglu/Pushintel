import type { Logger } from 'pino'
import type { PushGateway } from './base.gateway'
import type { Platform } from '../push.types'
import { RetryGateway } from './retry.gateway'
import { LoggingGateway } from './logging.gateway'

export class GatewayFactory {
  constructor(
    private fcmGateway: PushGateway,
    private apnsGateway: PushGateway,
    private logger: Logger,
  ) {}

  create(platform: Platform): PushGateway {
    const base = platform === 'IOS' ? this.apnsGateway : this.fcmGateway
    return new LoggingGateway(new RetryGateway(base), this.logger)
  }
}
