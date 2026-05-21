import type { PushService } from '../../push/push.service'
import type { SegmentService } from '../../segments/segment.service'
import type { AnalyticsService } from '../../analytics/analytics.service'
import { createSendPushTool } from './send-push'
import { createSchedulePushTool } from './schedule-push'
import { createListSegmentsTool } from './list-segments'
import { createCreateSegmentTool } from './create-segment'
import { createGetStatsTool } from './get-stats'
import { createAbTestTool } from './ab-test'

export interface McpTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
  handler: (input: unknown) => Promise<unknown>
}

export function registerTools(
  pushService: PushService,
  segmentService: SegmentService,
  analyticsService: AnalyticsService,
): McpTool[] {
  return [
    createSendPushTool(pushService),
    createSchedulePushTool(pushService, segmentService),
    createListSegmentsTool(segmentService),
    createCreateSegmentTool(segmentService),
    createGetStatsTool(analyticsService),
    createAbTestTool(pushService, segmentService),
  ]
}
