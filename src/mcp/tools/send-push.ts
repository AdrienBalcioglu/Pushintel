import { z } from 'zod'
import type { PushService } from '../../push/push.service'

export const sendPushSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  segment: z.string().min(1),
  data: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().optional(),
})

export function createSendPushTool(pushService: PushService) {
  return {
    name: 'send_push',
    description: 'Send an immediate push notification to a segment of devices',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Notification title' },
        body: { type: 'string', description: 'Notification body' },
        segment: { type: 'string', description: 'Segment name or "all"' },
        data: { type: 'object', description: 'Custom payload key-value pairs' },
        imageUrl: { type: 'string', description: 'Optional image URL' },
      },
      required: ['title', 'body', 'segment'],
    },
    handler: async (input: unknown) => {
      const params = sendPushSchema.parse(input)
      const { campaignId, queued } = await pushService.sendToSegment(params.segment, {
        title: params.title,
        body: params.body,
        data: params.data,
        imageUrl: params.imageUrl,
      })

      return {
        campaignId,
        queued,
        estimatedDelivery: new Date(Date.now() + 5000).toISOString(),
      }
    },
  }
}
