import type { PrismaClient } from '@prisma/client'

export interface PlatformStats {
  sent: number
  delivered: number
}

interface CampaignStats {
  byStatus: {
    SENT: number
    DELIVERED: number
    FAILED: number
    OPENED: number
  }
  byPlatform: {
    IOS: PlatformStats
    ANDROID: PlatformStats
    WEB: PlatformStats
  }
  total: number
}

export class DeliveryRepository {
  constructor(private prisma: PrismaClient) {}

  async getStatsByCampaign(campaignId: string): Promise<CampaignStats> {
    // Single SQL aggregation via Prisma groupBy — O(1) rows, not O(n) in JS
    const [statusAgg, platformAgg] = await Promise.all([
      this.prisma.deliveryEvent.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: { status: true },
      }),
      this.prisma.deliveryEvent.groupBy({
        by: ['platform', 'status'],
        where: { campaignId },
        _count: { status: true },
      }),
    ])

    const byStatus = { SENT: 0, DELIVERED: 0, FAILED: 0, OPENED: 0 } as Record<string, number>
    for (const row of statusAgg) {
      byStatus[row.status] = row._count.status
    }

    const byPlatform = {
      IOS: { sent: 0, delivered: 0 } as PlatformStats,
      ANDROID: { sent: 0, delivered: 0 } as PlatformStats,
      WEB: { sent: 0, delivered: 0 } as PlatformStats,
    }
    for (const row of platformAgg) {
      const platformStats = byPlatform[row.platform as keyof typeof byPlatform]
      if (!platformStats) continue
      if (row.status === 'SENT') platformStats.sent += row._count.status
      if (row.status === 'DELIVERED' || row.status === 'OPENED') {
        platformStats.delivered += row._count.status
      }
    }

    const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0)

    return {
      byStatus: byStatus as CampaignStats['byStatus'],
      byPlatform,
      total,
    }
  }
}