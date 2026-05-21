import type { SegmentRepository } from './segment.repository'
import type { TokenService } from '../tokens/token.service'
import type { SegmentFilters } from './segment.types'
import type { Platform } from '@prisma/client'

export class SegmentService {
  constructor(
    private segmentRepo: SegmentRepository,
    private tokenService: TokenService,
  ) {}

  async create(name: string, filters: SegmentFilters) {
    const segment = await this.segmentRepo.create(name, filters)
    const tokenCount = await this.tokenService.countForSegment(filters)
    return { ...segment, tokenCount }
  }

  async listWithCounts() {
    const segments = await this.segmentRepo.findAll()
    return Promise.all(
      segments.map(async (s: { id: string; name: string; filters: unknown; createdAt: Date }) => {
        const filters = s.filters as SegmentFilters
        const tokenCount = await this.tokenService.countForSegment(filters)
        return { ...s, tokenCount }
      }),
    )
  }

  async resolveTokens(segmentName: string) {
    if (segmentName === 'all') {
      return this.tokenService.getForSegment({})
    }
    const segment = await this.segmentRepo.findByName(segmentName)
    if (!segment) throw new Error(`Segment "${segmentName}" not found`)
    return this.tokenService.getForSegment(segment.filters as SegmentFilters)
  }

  async resolveTokenCount(segmentName: string): Promise<number> {
    if (segmentName === 'all') {
      return this.tokenService.countForSegment({})
    }
    const segment = await this.segmentRepo.findByName(segmentName)
    if (!segment) throw new Error(`Segment "${segmentName}" not found`)
    const filters = segment.filters as { platform?: Platform; tags?: string[]; userIds?: string[] }
    return this.tokenService.countForSegment(filters)
  }
}
