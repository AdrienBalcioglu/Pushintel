import type { PrismaClient, DeliveryStatus, Platform } from '@prisma/client'

export class DeliveryRepository {
  constructor(private prisma: PrismaClient) {}

  async getStatsByCampaign(campaignId: string) {
    const events = await this.prisma.deliveryEvent.findMany({ where: { campaignId } })

    const byStatus: Record<DeliveryStatus, number> = {
      SENT: 0,
      DELIVERED: 0,
      FAILED: 0,
      OPENED: 0,
    }

    const byPlatform: Record<Platform, { sent: number; delivered: number }> = {
      IOS: { sent: 0, delivered: 0 },
      ANDROID: { sent: 0, delivered: 0 },
      WEB: { sent: 0, delivered: 0 },
    }

    for (const e of events) {
      byStatus[e.status]++
      if (e.status === 'SENT') byPlatform[e.platform].sent++
      if (e.status === 'DELIVERED') byPlatform[e.platform].delivered++
    }

    return { byStatus, byPlatform, total: events.length }
  }
}
