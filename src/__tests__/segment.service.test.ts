import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SegmentService } from '../segments/segment.service'
import type { SegmentRepository } from '../segments/segment.repository'
import type { TokenService } from '../tokens/token.service'

const mockSegmentRepo = {
  create: vi.fn(),
  findAll: vi.fn(),
  findByName: vi.fn(),
  findById: vi.fn(),
} as unknown as SegmentRepository

const mockTokenService = {
  register: vi.fn(),
  deactivate: vi.fn(),
  getForSegment: vi.fn(),
  countForSegment: vi.fn(),
} as unknown as TokenService

describe('SegmentService', () => {
  let service: SegmentService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SegmentService(mockSegmentRepo, mockTokenService)
  })

  it('creates a segment and returns token count', async () => {
    const mockSegment = { id: 'clxxx', name: 'ios-users', filters: { platform: 'IOS' }, createdAt: new Date() }
    ;(mockSegmentRepo.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockSegment)
    ;(mockTokenService.countForSegment as ReturnType<typeof vi.fn>).mockResolvedValue(42)

    const result = await service.create('ios-users', { platform: 'IOS' })

    expect(result.name).toBe('ios-users')
    expect(result.tokenCount).toBe(42)
    expect(mockSegmentRepo.create).toHaveBeenCalledWith('ios-users', { platform: 'IOS' })
  })

  it('resolves tokens for "all" segment without querying db', async () => {
    ;(mockTokenService.getForSegment as ReturnType<typeof vi.fn>).mockResolvedValue([])
    await service.resolveTokens('all')
    expect(mockSegmentRepo.findByName as ReturnType<typeof vi.fn>).not.toHaveBeenCalled()
    expect(mockTokenService.getForSegment as ReturnType<typeof vi.fn>).toHaveBeenCalledWith({})
  })

  it('throws if named segment not found', async () => {
    ;(mockSegmentRepo.findByName as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    await expect(service.resolveTokens('unknown')).rejects.toThrow('Segment "unknown" not found')
  })
})
