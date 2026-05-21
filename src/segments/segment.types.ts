import type { Platform } from '@prisma/client'

export interface SegmentFilters {
  platform?: Platform
  tags?: string[]
  userIds?: string[]
}
