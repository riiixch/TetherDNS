import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })

    try {
        const logs = await prisma.updateLog.findMany({
            where: { recordId: parseInt(id) },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        return { success: true, data: logs }
    } catch (e: any) {
        throw createError({ statusCode: 500, statusMessage: e.message || 'Failed to fetch history' })
    }
})
