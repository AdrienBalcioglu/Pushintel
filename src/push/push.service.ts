import type { PrismaClient } from '@prisma/client'
import type { Queue } from 'bullmq'
import type { SegmentService } from '../segments/segment.service'
import type { PushJobData } from '../queue/push.queue'
import type { Notification } from './push.types'

export class PushService {
  constructor(
    private prisma: PrismaClient,
    private pushQueue: Queue<PushJobData>,
    private segmentService: SegmentService,
  ) {}

  async sendToSegment(
    segment: string,
    notification: Notification,
    scheduledAt?: Date,
  ): Promise<{ campaignId: string; queued: number }> {
    const tokens = await this.segmentService.resolveTokens(segment)

    const segmentRecord = segment !== 'all'
      ? await this.prisma.segment.findUnique({ where: { name: segment } })
      : null

    const campaign = await this.prisma.campaign.create({
      data: {
        title: notification.title,
        body: notification.body,
        data: notification.data ?? {},
        segmentId: segmentRecord?.id ?? (await this.getOrCreateAllSegment()),
        status: scheduledAt ? 'SCHEDULED' : 'SENDING',
        scheduledAt: scheduledAt ?? null,
      },
    })

    const delay = scheduledAt ? scheduledAt.getTime() - Date.now() : 0

    const jobs = tokens.map((t: { id: string; token: string; platform: string }) => ({
      name: `push-${t.id}`,
      data: {
        token: t.token,
        platform: t.platform as 'IOS' | 'ANDROID' | 'WEB',
        notification,
        campaignId: campaign.id,
      },
      opts: { delay: delay > 0 ? delay : undefined },
    }))

    await this.pushQueue.addBulk(jobs)

    return { campaignId: campaign.id, queued: tokens.length }
  }

  private async getOrCreateAllSegment(): Promise<string> {
    const existing = await this.prisma.segment.findUnique({ where: { name: '__all__' } })
    if (existing) return existing.id
    const created = await this.prisma.segment.create({
      data: { name: '__all__', filters: {} },
    })
    return created.id
  }
}
