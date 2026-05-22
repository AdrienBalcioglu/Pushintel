import type { PushGateway } from './base.gateway'
import type { GatewayResult, Notification } from '../push.types'

interface ExpoPushResponse {
  data: Array<{
    status: 'ok' | 'error'
    id?: string
    message?: string
    details?: { error?: string }
  }>
}

export class ExpoGateway implements PushGateway {
  private readonly endpoint = 'https://exp.host/--/api/v2/push/send'

  async send(token: string, notification: Notification): Promise<GatewayResult> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data ?? {},
        sound: 'default',
      }),
    })

    if (!res.ok) {
      return { success: false, error: `Expo API HTTP ${res.status}` }
    }

    const raw = (await res.json()) as ExpoPushResponse | { data: ExpoPushResponse['data'][0] }
    const result = Array.isArray((raw as ExpoPushResponse).data)
      ? (raw as ExpoPushResponse).data[0]
      : (raw as { data: ExpoPushResponse['data'][0] }).data

    if (!result || result.status === 'error') {
      const isInvalid = result?.details?.error === 'DeviceNotRegistered'
      return {
        success: false,
        invalidToken: isInvalid,
        error: result?.message ?? 'Expo push error',
      }
    }

    return { success: true, messageId: result.id }
  }
}
