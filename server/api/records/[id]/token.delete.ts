import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })

    try {
        const record = await prisma.dnsRecord.findUnique({ where: { id: parseInt(id) } })
        if (!record) throw createError({ statusCode: 404, statusMessage: 'Record not found' })

        await prisma.dnsRecord.update({
            where: { id: record.id },
            data: { updateToken: null }
        })

        return {
            success: true,
            message: 'DDNS update token revoked successfully'
        }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
