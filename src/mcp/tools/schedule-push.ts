import { z } from 'zod'
import type { PushService } from '../../push/push.service'
import type { SegmentService } from '../../segments/segment.service'

export const schedulePushSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  segment: z.string().min(1),
  scheduledAt: z.string().datetime(),
  data: z.record(z.string(), z.string()).optional(),
})

export function createSchedulePushTool(pushService: PushService, segmentService: SegmentService) {
  return {
    name: 'schedule_push',
    description: 'Schedule a push notification for a future date',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        segment: { type: 'string' },
        scheduledAt: { type: 'string', description: 'ISO 8601 datetime' },
        data: { type: 'object' },
      },
      required: ['title', 'body', 'segment', 'scheduledAt'],
    },
    handler: async (input: unknown) => {
      const params = schedulePushSchema.parse(input)
      const scheduledDate = new Date(params.scheduledAt)

      if (scheduledDate <= new Date()) {
        throw new Error('scheduledAt must be in the future')
      }

      const tokenCount = await segmentService.resolveTokenCount(params.segment)
      const { campaignId } = await pushService.sendToSegment(
        params.segment,
        { title: params.title, body: params.body, data: params.data },
        scheduledDate,
      )

      return {
        campaignId,
        scheduledAt: params.scheduledAt,
        segment: params.segment,
        tokenCount,
      }
    },
  }
}
