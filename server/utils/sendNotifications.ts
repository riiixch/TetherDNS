import { prisma } from './prisma'
import { decrypt } from './decrypt'
import { sendDiscord, type NotificationPayload } from './sendDiscord'
import { sendTelegram } from './sendTelegram'
import { sendEmail } from './sendEmail'
import { sendLine } from './sendLine'
import { sendWebhook } from './sendWebhook'

export async function sendNotifications(payload: NotificationPayload) {
    try {
        const channels = await prisma.notificationChannel.findMany({ where: { enabled: true } })
        if (channels.length === 0) return

        const currentEvent = payload.eventType || 'DDNS'
        // Map RECOVERY to FAILOVER for subscription check (Health Failover & Recovery)
        const eventKey = currentEvent === 'RECOVERY' ? 'FAILOVER' : currentEvent

        // Dispatch to all enabled and subscribed channels in parallel
        await Promise.allSettled(
            channels.map(async (channel) => {
                try {
                    // Check granular event subscription
                    if (channel.events) {
                        try {
                            const subscribedEvents: string[] = JSON.parse(channel.events)
                            if (Array.isArray(subscribedEvents) && !subscribedEvents.includes(eventKey)) {
                                return // Skip if channel is not subscribed to this event type
                            }
                        } catch {
                            // Fallback to allow if events json is corrupted
                        }
                    }

                    const config = JSON.parse(decrypt(channel.config))

                    switch (channel.type) {
                        case 'discord':
                            await sendDiscord(config, payload)
                            break
                        case 'telegram':
                            await sendTelegram(config, payload)
                            break
                        case 'email':
                            await sendEmail(config, payload)
                            break
                        case 'line':
                            await sendLine(config.token, payload)
                            break
                        case 'webhook':
                            await sendWebhook(config.webhookUrl, payload)
                            break
                        default:
                            console.warn(`[Notify] Unknown channel type: ${channel.type}`)
                    }

                    // Update lastUsedAt asynchronously
                    prisma.notificationChannel.update({
                        where: { id: channel.id },
                        data: { lastUsedAt: new Date() }
                    }).catch(() => {})
                } catch (err: any) {
                    console.error(`[Notify] Failed to send via ${channel.type} (${channel.label}):`, err.message)
                }
            })
        )
    } catch (err) {
        console.error('[Notify] Error fetching channels:', err)
    }
}
