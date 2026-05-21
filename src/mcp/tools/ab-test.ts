import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import type { PushService } from '../../push/push.service'
import type { SegmentService } from '../../segments/segment.service'

export const abTestSchema = z.object({
  segment: z.string().min(1),
  variantA: z.object({ title: z.string().min(1), body: z.string().min(1) }),
  variantB: z.object({ title: z.string().min(1), body: z.string().min(1) }),
  splitPercent: z.number().int().min(1).max(99),
})

export function createAbTestTool(pushService: PushService, segmentService: SegmentService) {
  return {
    name: 'ab_test',
    description: 'Create an A/B test between two message variants',
    inputSchema: {
      type: 'object' as const,
      properties: {
        segment: { type: 'string' },
        variantA: {
          type: 'object',
          properties: { title: { type: 'string' }, body: { type: 'string' } },
          required: ['title', 'body'],
        },
        variantB: {
          type: 'object',
          properties: { title: { type: 'string' }, body: { type: 'string' } },
          required: ['title', 'body'],
        },
        splitPercent: { type: 'number', description: '0-100, % sent to variant A' },
      },
      required: ['segment', 'variantA', 'variantB', 'splitPercent'],
    },
    handler: async (input: unknown) => {
      const params = abTestSchema.parse(input)
      const tokens = await segmentService.resolveTokens(params.segment)

      const splitIndex = Math.floor((tokens.length * params.splitPercent) / 100)
      const tokensA = tokens.slice(0, splitIndex)
      const tokensB = tokens.slice(splitIndex)

      const testId = uuidv4()
      const segmentAName = `__ab_${testId}_a`
      const segmentBName = `__ab_${testId}_b`

      const [segA, segB] = await Promise.all([
        segmentService.create(segmentAName, {
          userIds: tokensA.map((t: { userId: string }) => t.userId),
        }),
        segmentService.create(segmentBName, {
          userIds: tokensB.map((t: { userId: string }) => t.userId),
        }),
      ])

      const [resultA, resultB] = await Promise.all([
        pushService.sendToSegment(segmentAName, params.variantA),
        pushService.sendToSegment(segmentBName, params.variantB),
      ])

      return {
        testId,
        campaignAId: resultA.campaignId,
        campaignBId: resultB.campaignId,
        tokensA: segA.tokenCount,
        tokensB: segB.tokenCount,
      }
    },
  }
}
