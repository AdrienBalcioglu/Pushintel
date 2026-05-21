import { z } from 'zod'
import type { SegmentService } from '../../segments/segment.service'

export const createSegmentSchema = z.object({
  name: z.string().min(1),
  filters: z.object({
    platform: z.enum(['IOS', 'ANDROID', 'WEB']).optional(),
    tags: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
  }),
})

export function createCreateSegmentTool(segmentService: SegmentService) {
  return {
    name: 'create_segment',
    description: 'Create a new segment with device filters',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Unique segment name' },
        filters: {
          type: 'object',
          properties: {
            platform: { type: 'string', enum: ['IOS', 'ANDROID', 'WEB'] },
            tags: { type: 'array', items: { type: 'string' } },
            userIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['name', 'filters'],
    },
    handler: async (input: unknown) => {
      const params = createSegmentSchema.parse(input)
      const result = await segmentService.create(params.name, params.filters)
      return {
        id: result.id,
        name: result.name,
        tokenCount: result.tokenCount,
      }
    },
  }
}
