import type { GatewayResult, Notification } from '../push.types'

export interface PushGateway {
  send(token: string, notification: Notification): Promise<GatewayResult>
}
