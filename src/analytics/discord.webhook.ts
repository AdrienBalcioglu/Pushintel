import type { AnalyticsJobData } from '../queue/workers/analytics.worker'

export class DiscordWebhook {
  constructor(private webhookUrl: string) {}

  async sendCampaignReport(data: AnalyticsJobData): Promise<void> {
    const { campaignId, sent, delivered, failed, opened } = data
    const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0

    const payload = {
      embeds: [
        {
          title: '📊 Campaign Report',
          color: failed > 0 ? 0xff0000 : 0x00ff00,
          fields: [
            { name: 'Campaign ID', value: campaignId, inline: true },
            { name: 'Sent', value: String(sent), inline: true },
            { name: 'Delivered', value: String(delivered), inline: true },
            { name: 'Failed', value: String(failed), inline: true },
            { name: 'Opened', value: String(opened), inline: true },
            { name: 'Delivery Rate', value: `${deliveryRate}%`, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }

    const res = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Discord webhook failed: ${res.status}`)
    }
  }
}
