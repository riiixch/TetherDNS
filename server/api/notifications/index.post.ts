import { prisma } from '../../utils/prisma'
import { encrypt } from '../../utils/crypto'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body.type || !body.label || !body.config) {
        throw createError({ statusCode: 400, statusMessage: 'type, label, and config are required' })
    }

    if (!['discord', 'line'].includes(body.type)) {
        throw createError({ statusCode: 400, statusMessage: 'type must be "discord" or "line"' })
    }

    try {
        const encryptedConfig = encrypt(JSON.stringify(body.config))

        const channel = await prisma.notificationChannel.create({
            data: {
                type: body.type,
                label: body.label,
                config: encryptedConfig,
                enabled: true,
            }
        })

        return { success: true, data: { id: channel.id, type: channel.type, label: channel.label } }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
