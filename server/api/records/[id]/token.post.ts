import { prisma } from '../../../utils/prisma'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })

    try {
        const record = await prisma.dnsRecord.findUnique({ where: { id: parseInt(id) } })
        if (!record) throw createError({ statusCode: 404, statusMessage: 'Record not found' })

        // Generate a random 32-character token
        const token = crypto.randomBytes(16).toString('hex')

        await prisma.dnsRecord.update({
            where: { id: record.id },
            data: { updateToken: token }
        })

        return {
            success: true,
            token,
            message: 'DDNS update token generated successfully'
        }
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }
})
