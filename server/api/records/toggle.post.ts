import { prisma } from '../../utils/prisma'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id, isAutoUpdate } = body

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })
    }

    try {
        const record = await prisma.dnsRecord.update({
            where: { id: parseInt(id) },
            data: { isAutoUpdate: Boolean(isAutoUpdate) },
            include: { zone: true }
        })

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'TOGGLE_DDNS',
                `Record: ${record.name} (${record.type})`,
                { isAutoUpdate: record.isAutoUpdate }
            )
        }

        return { success: true, data: record }
    } catch (e: any) {
        throw createError({
            statusCode: e.statusCode || 500,
            statusMessage: e.message || 'Failed to toggle DDNS auto-update'
        })
    }
})
