import type { App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import type { PushGateway } from './base.gateway'
import type { GatewayResult, Notification } from '../push.types'

export class FCMGateway implements PushGateway {
  constructor(private app: App | null) {}

  async send(token: string, notification: Notification): Promise<GatewayResult> {
    if (!this.app) {
      return { success: false, error: 'Firebase not configured — add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env' }
    }
    try {
      const messageId = await getMessaging(this.app).send({
        token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data,
      })
      return { success: true, messageId }
    } catch (err) {
      const error = err as { code?: string; message?: string }
      const invalidToken =
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      return { success: false, invalidToken, error: error.message ?? 'FCM error' }
    }
  }
}
