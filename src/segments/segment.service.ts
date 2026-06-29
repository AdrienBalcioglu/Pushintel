import type { SegmentRepository } from './segment.repository'
import type { TokenService } from '../tokens/token.service'
import type { SegmentFilters, SegmentWithCount } from './segment.types'

export class SegmentService {
  constructor(
    private segmentRepo: SegmentRepository,
    private tokenService: TokenService,
  ) {}

  async create(name: string, filters: SegmentFilters): Promise<SegmentWithCount> {
    const segment = await this.segmentRepo.create(name, filters)
    const tokenCount = await this.tokenService.countForSegment(filters)
    return { id: segment.id, name: segment.name, filters, createdAt: segment.createdAt, tokenCount }
  }

  async listWithCounts(): Promise<SegmentWithCount[]> {
    const segments = await this.segmentRepo.findAll()
    return Promise.all(
      segments.map(async (s) => {
        const filters = s.filters as SegmentFilters
        const tokenCount = await this.tokenService.countForSegment(filters)
        return { id: s.id, name: s.name, filters, createdAt: s.createdAt, tokenCount }
      }),
    )
  }

  async resolveTokens(segmentName: string): Promise<Array<{ id: string; token: string; platform: string; userId: string }>> {
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
    return this.tokenService.countForSegment(segment.filters as SegmentFilters)
  }

  /**
   * Delete temporary segments created for A/B tests (prefixed with __ab_).
   * Should be called after campaign reports are consumed.
   */
  async cleanupAbSegments(olderThanHours = 24): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    const segments = await this.segmentRepo.findTemporary('__ab_', cutoff)
    const ids = segments.map((s) => s.id)
    if (ids.length > 0) {
      await this.segmentRepo.deleteMany(ids)
    }
    return ids.length
  }
}