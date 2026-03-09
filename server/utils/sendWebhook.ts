import type { NotificationPayload } from './sendDiscord'

export async function sendWebhook(webhookUrl: string, payload: NotificationPayload) {
    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: 'tetherdns.notification',
            timestamp: new Date().toISOString(),
            data: payload
        })
    })
}
