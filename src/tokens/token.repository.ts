import type { PrismaClient, Platform, Prisma } from '@prisma/client'

export interface RegisterTokenInput {
  userId: string
  token: string
  platform: Platform
  tags?: string[]
}

export class TokenRepository {
  constructor(private prisma: PrismaClient) {}

  async upsert(input: RegisterTokenInput) {
    return this.prisma.deviceToken.upsert({
      where: { token: input.token },
      update: { userId: input.userId, platform: input.platform, tags: input.tags ?? [], active: true },
      create: input,
    })
  }

  async deactivate(token: string): Promise<void> {
    await this.prisma.deviceToken.updateMany({ where: { token }, data: { active: false } })
  }

  async findByFilters(filters: { platform?: Platform; tags?: string[]; userIds?: string[] }) {
    return this.prisma.deviceToken.findMany({
      where: this.buildWhereClause(filters),
    })
  }

  async countByFilters(filters: { platform?: Platform; tags?: string[]; userIds?: string[] }): Promise<number> {
    return this.prisma.deviceToken.count({
      where: this.buildWhereClause(filters),
    })
  }

  private buildWhereClause(filters: { platform?: Platform; tags?: string[]; userIds?: string[] }): Prisma.DeviceTokenWhereInput {
    return {
      active: true,
      ...(filters.platform && { platform: filters.platform }),
      ...(filters.tags?.length && { tags: { hasSome: filters.tags } }),
      ...(filters.userIds?.length && { userId: { in: filters.userIds } }),
    }
  }
}