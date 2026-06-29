import type { Platform } from '@prisma/client'

export interface SegmentFilters {
  platform?: Platform
  tags?: string[]
  userIds?: string[]
}

/** Value returned by segment service operations */
export interface SegmentWithCount {
  id: string
  name: string
  filters: SegmentFilters
  createdAt: Date
  tokenCount: number
}