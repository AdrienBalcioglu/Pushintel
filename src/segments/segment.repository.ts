import type { PrismaClient, Prisma } from '@prisma/client'
import type { SegmentFilters } from './segment.types'

export class SegmentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(name: string, filters: SegmentFilters) {
    return this.prisma.segment.create({ data: { name, filters: filters as Prisma.InputJsonValue } })
  }

  async findAll() {
    return this.prisma.segment.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async findByName(name: string) {
    return this.prisma.segment.findUnique({ where: { name } })
  }

  async findById(id: string) {
    return this.prisma.segment.findUnique({ where: { id } })
  }

  /** Find temporary segments (A/B test) by prefix, older than a cutoff date */
  async findTemporary(namePrefix: string, createdBefore: Date) {
    return this.prisma.segment.findMany({
      where: {
        name: { startsWith: namePrefix },
        createdAt: { lt: createdBefore },
      },
    })
  }

  async deleteMany(ids: string[]): Promise<number> {
    const result = await this.prisma.segment.deleteMany({
      where: { id: { in: ids } },
    })
    return result.count
  }
}