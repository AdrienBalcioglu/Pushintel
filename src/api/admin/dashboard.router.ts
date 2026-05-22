import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireRole } from '../../auth/rbac.middleware'

export function createDashboardApiRouter(prisma: PrismaClient): Router {
  const router = Router()

  router.get('/overview', requireRole('VIEWER'), async (_req, res) => {
    const [tokenCount, campaignCount, deliveryStats, recentCampaigns] = await Promise.all([
      prisma.deviceToken.count({ where: { active: true } }),
      prisma.campaign.count(),
      prisma.deliveryEvent.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { _count: { select: { deliveries: true } } },
      }),
    ])

    const stats = { SENT: 0, DELIVERED: 0, FAILED: 0, OPENED: 0 }
    for (const row of deliveryStats) {
      stats[row.status] = row._count.status
    }

    const total = stats.SENT + stats.DELIVERED + stats.FAILED + stats.OPENED
    const delivered = stats.DELIVERED + stats.OPENED

    res.json({
      tokens: tokenCount,
      campaigns: campaignCount,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
      totalSent: total,
      recentCampaigns: recentCampaigns.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        deliveries: c._count.deliveries,
        createdAt: c.createdAt,
      })),
    })
  })

  router.get('/campaigns', requireRole('VIEWER'), async (_req, res) => {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        segment: { select: { name: true } },
        _count: { select: { deliveries: true } },
      },
    })
    res.json({ campaigns })
  })

  router.get('/campaigns/:id', requireRole('VIEWER'), async (req, res) => {
    const id = req.params['id'] as string
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { segment: true },
    })
    if (!campaign) { res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }); return }

    const events = await prisma.deliveryEvent.groupBy({
      by: ['status', 'platform'],
      where: { campaignId: id },
      _count: { status: true },
    })

    const byStatus: Record<string, number> = {}
    const byPlatform: Record<string, Record<string, number>> = {}
    for (const e of events) {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + e._count.status
      if (!byPlatform[e.platform]) byPlatform[e.platform] = {}
      byPlatform[e.platform][e.status] = e._count.status
    }

    res.json({ campaign, byStatus, byPlatform })
  })

  router.get('/apikeys', requireRole('ADMIN'), async (_req, res) => {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, role: true, active: true, createdAt: true, lastUsed: true },
    })
    res.json({ keys })
  })

  return router
}
