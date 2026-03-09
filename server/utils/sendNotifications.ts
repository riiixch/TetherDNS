import { prisma } from './prisma'
import { decrypt } from './decrypt'
import { sendDiscord, type NotificationPayload } from './sendDiscord'
import { sendLine } from './sendLine'
import { sendWebhook } from './sendWebhook'

export async function sendNotifications(payload: NotificationPayload) {
    try {
        const channels = await prisma.notificationChannel.findMany({ where: { enabled: true } })

        for (const channel of channels) {
            try {
                const config = JSON.parse(decrypt(channel.config))

                switch (channel.type) {
                    case 'discord':
                        await sendDiscord(config.webhookUrl, payload)
                        break
                    case 'line':
                        await sendLine(config.token, payload)
                        break
                    case 'webhook':
                        await sendWebhook(config.webhookUrl, payload)
                        break
                }
            } catch (err: any) {
                console.error(`[Notify] Failed to send via ${channel.type} (${channel.label}):`, err.message)
            }
        }
    } catch (err) {
        console.error('[Notify] Error fetching channels:', err)
    }
}
