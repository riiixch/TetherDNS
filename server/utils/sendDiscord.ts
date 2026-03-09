export interface NotificationPayload {
    title: string
    message: string
    color?: string // for Discord
}

export async function sendDiscord(webhookUrl: string, payload: NotificationPayload) {
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
