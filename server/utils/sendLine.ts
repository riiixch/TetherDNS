import type { NotificationPayload } from './sendDiscord'

export async function sendLine(token: string, payload: NotificationPayload) {
    await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`
        },
        body: `message=\n${payload.title}\n${payload.message}`
    })
}
