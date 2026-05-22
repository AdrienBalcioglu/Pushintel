import apn from 'apn'
import type { PushGateway } from './base.gateway'
import type { GatewayResult, Notification } from '../push.types'
import { config } from '../../config/env'

export class APNsGateway implements PushGateway {
  private provider: apn.Provider | null = null

  constructor() {
    if (config.APNS_KEY_ID && config.APNS_TEAM_ID && config.APNS_BUNDLE_ID) {
      this.provider = new apn.Provider({
        token: {
          key: config.APNS_KEY_PATH,
          keyId: config.APNS_KEY_ID,
          teamId: config.APNS_TEAM_ID,
        },
        production: config.APNS_PRODUCTION,
      })
    }
  }

  async send(token: string, notification: Notification): Promise<GatewayResult> {
    if (!this.provider) {
      return { success: false, error: 'APNs not configured — add APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID to .env' }
    }

    const note = new apn.Notification()
    note.alert = { title: notification.title, body: notification.body }
    note.topic = config.APNS_BUNDLE_ID ?? ''
    note.payload = notification.data ?? {}
    if (notification.imageUrl) note.payload['imageUrl'] = notification.imageUrl

    const result = await this.provider.send(note, token)

    if (result.failed.length > 0) {
      const failure = result.failed[0]
      const invalidToken =
        failure.response?.reason === 'BadDeviceToken' ||
        failure.response?.reason === 'Unregistered'
      return { success: false, invalidToken, error: failure.response?.reason ?? 'APNs error' }
    }

    return { success: true }
  }

  shutdown(): void {
    this.provider?.shutdown()
  }
}
