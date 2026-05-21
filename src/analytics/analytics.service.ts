import type { PrismaClient } from '@prisma/client'
import type { DeliveryRepository } from './delivery.repository'

export class AnalyticsService {
  constructor(
    private prisma: PrismaClient,
    private deliveryRepo: DeliveryRepository,
  ) {}

  async getCampaignStats(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw new Error(`Campaign "${campaignId}" not found`)

    const { byStatus, byPlatform } = await this.deliveryRepo.getStatsByCampaign(campaignId)

    const sent = byStatus.SENT + byStatus.DELIVERED + byStatus.OPENED
    const delivered = byStatus.DELIVERED + byStatus.OPENED
    const failed = byStatus.FAILED
    const opened = byStatus.OPENED

    return {
      campaignId,
      status: campaign.status,
      sent,
      delivered,
      failed,
      opened,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
      openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
      byPlatform: {
        ios: byPlatform.IOS,
        android: byPlatform.ANDROID,
      },
    }
  }
}
