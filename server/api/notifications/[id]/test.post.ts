import { prisma } from '../../../utils/prisma'
import { decrypt } from '../../../utils/decrypt'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required' })

    try {
        const channel = await prisma.notificationChannel.findUnique({ where: { id: parseInt(id) } })
        if (!channel) throw createError({ statusCode: 404, statusMessage: 'Channel not found' })

        const config = JSON.parse(decrypt(channel.config))

        switch (channel.type) {
            case 'discord':
                await fetch(config.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [{
                            title: '🔔 Test Notification',
                            description: 'Cloudflare DDNS Manager notification is working!',
                            color: 0x5865f2,
                            timestamp: new Date().toISOString()
                        }]
                    })
                })
                break
            case 'line':
                await fetch('https://notify-api.line.me/api/notify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Bearer ${config.token}`
                    },
                    body: `message=\n🔔 Test Notification\nCloudflare DDNS Manager notification is working!`
                })
                break
        }

        return { success: true, message: 'Test notification sent!' }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to send test notification' })
    }
})
