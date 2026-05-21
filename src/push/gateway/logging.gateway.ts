import type { Logger } from 'pino'
import type { PushGateway } from './base.gateway'
import type { GatewayResult, Notification } from '../push.types'

export class LoggingGateway implements PushGateway {
  constructor(
    private inner: PushGateway,
    private logger: Logger,
  ) {}

  async send(token: string, notification: Notification): Promise<GatewayResult> {
    this.logger.info({ token, title: notification.title }, 'sending push')
    const result = await this.inner.send(token, notification)
    if (result.success) {
      this.logger.info({ token, messageId: result.messageId }, 'push sent')
    } else {
      this.logger.warn({ token, error: result.error, invalidToken: result.invalidToken }, 'push failed')
    }
    return result
  }
}
