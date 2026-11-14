import { prisma } from '../../../utils/prisma'
import { decrypt } from '../../../utils/decrypt'
import { sendDiscord } from '../../../utils/sendDiscord'
import { sendTelegram } from '../../../utils/sendTelegram'
import { sendEmail } from '../../../utils/sendEmail'
import { sendLine } from '../../../utils/sendLine'
import { sendWebhook } from '../../../utils/sendWebhook'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required' })

    try {
        const channel = await prisma.notificationChannel.findUnique({ where: { id: parseInt(id) } })
        if (!channel) throw createError({ statusCode: 404, statusMessage: 'Channel not found' })

        const config = JSON.parse(decrypt(channel.config))

        const testPayload = {
            title: '🔔 Test Notification',
            message: 'TetherDNS notification pipeline is operating smoothly!',
            color: 'success' as const,
            eventType: 'SECURITY' as const,
            fields: [
                { name: 'Channel', value: channel.label },
                { name: 'Provider', value: channel.type.toUpperCase() },
                { name: 'Status', value: 'Active & Verified' }
            ]
        }

        switch (channel.type) {
            case 'discord':
                await sendDiscord(config, testPayload)
                break
            case 'telegram':
                await sendTelegram(config, testPayload)
                break
            case 'email':
                await sendEmail(config, testPayload)
                break
            case 'line':
                await sendLine(config.token, testPayload)
                break
            case 'webhook':
                await sendWebhook(config.webhookUrl, testPayload)
                break
            default:
                throw new Error(`Unsupported channel type: ${channel.type}`)
        }

        return { success: true, message: `Test notification sent successfully via ${channel.type.toUpperCase()}!` }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to send test notification' })
    }
})
