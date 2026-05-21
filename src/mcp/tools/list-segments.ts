import { z } from 'zod'
import type { SegmentService } from '../../segments/segment.service'

export const listSegmentsSchema = z.object({})

export function createListSegmentsTool(segmentService: SegmentService) {
  return {
    name: 'list_segments',
    description: 'List all segments with their device token counts',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    handler: async (_input: unknown) => {
      const segments = await segmentService.listWithCounts()
      return {
        segments: segments.map((s: { id: string; name: string; tokenCount: number; filters: unknown }) => ({
          id: s.id,
          name: s.name,
          tokenCount: s.tokenCount,
          filters: s.filters,
        })),
      }
    },
  }
}
