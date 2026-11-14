import { prisma } from '../../utils/prisma'
import { encrypt } from '../../utils/encrypt'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'ID is required' })

    const body = await readBody(event)

    try {
        const data: any = {}
        if (typeof body.enabled === 'boolean') data.enabled = body.enabled
        if (body.label) data.label = body.label
        if (Array.isArray(body.events)) data.events = JSON.stringify(body.events)
        if (body.config) data.config = encrypt(JSON.stringify(body.config))

        const updated = await prisma.notificationChannel.update({
            where: { id: parseInt(id) },
            data
        })

        return { success: true, data: { id: updated.id, type: updated.type, label: updated.label, enabled: updated.enabled } }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message || 'Failed to update notification channel' })
    }
})
