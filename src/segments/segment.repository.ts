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
}
