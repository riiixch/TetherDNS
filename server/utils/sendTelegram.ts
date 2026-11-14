import type { NotificationPayload } from './sendDiscord'

export interface TelegramConfig {
    botToken: string
    chatId: string
    topicId?: string
    silentMode?: boolean
}

export async function sendTelegram(config: TelegramConfig, payload: NotificationPayload) {
    if (!config.botToken || !config.chatId) return

    // Pick header emoji
    let emoji = '⚡'
    if (payload.color === 'error' || payload.eventType === 'FAILOVER') emoji = '🚨'
    else if (payload.color === 'warning') emoji = '⚠️'
    else if (payload.color === 'success' || payload.eventType === 'RECOVERY') emoji = '✅'

    let html = `<b>${emoji} TetherDNS Alert</b>\n`
    html += `<b>${escapeHtml(payload.title)}</b>\n\n`
    html += `${escapeHtml(payload.message)}\n`

    if (payload.fields && payload.fields.length > 0) {
        html += `\n`
        for (const f of payload.fields) {
            html += `• <b>${escapeHtml(f.name)}:</b> <code>${escapeHtml(f.value)}</code>\n`
        }
    }

    html += `\n<i>⏱ ${new Date().toUTCString()} • TetherDNS</i>`

    const body: Record<string, any> = {
        chat_id: config.chatId,
        text: html,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    }

    if (config.topicId) {
        const topicNum = parseInt(config.topicId, 10)
        if (!isNaN(topicNum)) {
            body.message_thread_id = topicNum
        }
    }

    if (config.silentMode) {
        body.disable_notification = true
    }

    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    const data: any = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
        throw new Error(`Telegram send failed: ${data.description || res.statusText}`)
    }
}

function escapeHtml(str: string): string {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}
