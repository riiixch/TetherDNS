import { prisma } from '../utils/prisma'
import { decrypt } from '../utils/crypto'

interface NotificationPayload {
    title: string
    message: string
    color?: string // for Discord
}

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
                }
            } catch (err: any) {
                console.error(`[Notify] Failed to send via ${channel.type} (${channel.label}):`, err.message)
            }
        }
    } catch (err) {
        console.error('[Notify] Error fetching channels:', err)
    }
}

async function sendDiscord(webhookUrl: string, payload: NotificationPayload) {
    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [{
                title: payload.title,
                description: payload.message,
                color: payload.color === 'error' ? 0xff4444 : 0x44ff44,
                timestamp: new Date().toISOString()
            }]
        })
    })
}

async function sendLine(token: string, payload: NotificationPayload) {
    await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`
        },
        body: `message=\n${payload.title}\n${payload.message}`
    })
}
