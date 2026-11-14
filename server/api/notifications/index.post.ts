import { prisma } from '../../utils/prisma'
import { encrypt } from '../../utils/encrypt'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.type || !body.label || !body.config) {
        throw createError({ statusCode: 400, statusMessage: 'type, label, and config are required' })
    }

    const allowedTypes = ['discord', 'telegram', 'email', 'line', 'webhook']
    if (!allowedTypes.includes(body.type)) {
        throw createError({ statusCode: 400, statusMessage: `type must be one of: ${allowedTypes.join(', ')}` })
    }

    try {
        const encryptedConfig = encrypt(JSON.stringify(body.config))
        const events = Array.isArray(body.events)
            ? JSON.stringify(body.events)
            : JSON.stringify(['DDNS', 'FAILOVER', 'TUNNEL', 'SECURITY'])

        const channel = await prisma.notificationChannel.create({
            data: {
                type: body.type,
                label: body.label,
                config: encryptedConfig,
                events,
                enabled: body.enabled !== undefined ? Boolean(body.enabled) : true,
            }
        })

        return { success: true, data: { id: channel.id, type: channel.type, label: channel.label } }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
