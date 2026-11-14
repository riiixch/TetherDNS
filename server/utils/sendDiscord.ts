export interface DiscordConfig {
    webhookUrl: string
    botName?: string
    avatarUrl?: string
    mentionRole?: string // e.g. "123456789012345678" or "here"
}

export interface NotificationPayload {
    title: string
    message: string
    color?: 'success' | 'warning' | 'error' | 'info'
    eventType?: 'DDNS' | 'FAILOVER' | 'RECOVERY' | 'TUNNEL' | 'SECURITY'
    fields?: Array<{ name: string; value: string; inline?: boolean }>
    recordName?: string
}

export async function sendDiscord(configOrUrl: string | DiscordConfig, payload: NotificationPayload) {
    const config: DiscordConfig = typeof configOrUrl === 'string'
        ? { webhookUrl: configOrUrl }
        : configOrUrl

    if (!config.webhookUrl) return

    // Cyberpunk Hex Colors
    let hexColor = 0x12e08a // Green neon (success)
    if (payload.color === 'error') hexColor = 0xff4444 // Red neon (critical)
    else if (payload.color === 'warning') hexColor = 0xf59e0b // Amber (warning)
    else if (payload.color === 'info') hexColor = 0x2dd4ee // Cyan (info)

    // Mention string if critical or configured
    let content: string | undefined = undefined
    if (config.mentionRole && (payload.color === 'error' || payload.eventType === 'FAILOVER')) {
        content = config.mentionRole === 'here' || config.mentionRole === 'everyone'
            ? `@${config.mentionRole}`
            : `<@&${config.mentionRole}>`
    }

    const embedFields = payload.fields?.map(f => ({
        name: f.name,
        value: f.value,
        inline: f.inline !== false
    })) || []

    const body: Record<string, any> = {
        username: config.botName || 'TetherDNS Edge Guardian',
        avatar_url: config.avatarUrl || 'https://raw.githubusercontent.com/nuxt/modules/main/icons/cloudflare.svg',
        content,
        embeds: [{
            title: payload.title,
            description: payload.message,
            color: hexColor,
            fields: embedFields,
            footer: {
                text: 'TetherDNS • Edge Protection & DDNS Platform'
            },
            timestamp: new Date().toISOString()
        }]
    }

    const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Discord Webhook failed (${res.status}): ${text}`)
    }
}
