import { prisma } from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })

    try {
        const record = await prisma.dnsRecord.findUnique({
            where: { id: parseInt(id) },
            include: {
                healthCheck: {
                    include: {
                        history: {
                            orderBy: { createdAt: 'desc' },
                            take: 25
                        }
                    }
                }
            }
        })

        if (!record) throw createError({ statusCode: 404, statusMessage: 'Record not found' })

        return {
            success: true,
            data: record.healthCheck || null
        }
    } catch (e: any) {
        throw createError({ statusCode: e.statusCode || 500, statusMessage: e.statusMessage || e.message || 'Failed to fetch health check' })
    }
})
