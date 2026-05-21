import type { PushGateway } from './base.gateway'
import type { GatewayResult, Notification } from '../push.types'

export class RetryGateway implements PushGateway {
  constructor(
    private inner: PushGateway,
    private maxRetries = 3,
  ) {}

  async send(token: string, notification: Notification): Promise<GatewayResult> {
    let lastError: unknown
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const result = await this.inner.send(token, notification)
        if (result.success || result.invalidToken) return result
        lastError = result.error
      } catch (err) {
        lastError = err
      }
    }
    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    }
  }
}
