import { z } from 'zod'
import type { AnalyticsService } from '../../analytics/analytics.service'

export const getStatsSchema = z.object({
  campaignId: z.string().cuid(),
})

export function createGetStatsTool(analyticsService: AnalyticsService) {
  return {
    name: 'get_delivery_stats',
    description: 'Get delivery statistics for a campaign',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaignId: { type: 'string', description: 'Campaign CUID' },
      },
      required: ['campaignId'],
    },
    handler: async (input: unknown) => {
      const params = getStatsSchema.parse(input)
      return analyticsService.getCampaignStats(params.campaignId)
    },
  }
}
