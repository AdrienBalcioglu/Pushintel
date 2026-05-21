export interface Notification {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

export interface GatewayResult {
  success: boolean
  messageId?: string
  invalidToken?: boolean
  error?: string
}

export type Platform = 'IOS' | 'ANDROID' | 'WEB'
