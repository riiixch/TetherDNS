import { createCloudflareClient } from '../../utils/cloudflare'
import { logAudit } from '../../utils/audit'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Record ID is required' })
    }

    try {
        const record = await prisma.dnsRecord.findUnique({
            where: { id: parseInt(id) },
            include: { zone: true }
        })

        if (!record) throw createError({ statusCode: 404, statusMessage: 'Record not found' })
        if (!record.zone.accountId) throw createError({ statusCode: 400, statusMessage: 'Zone has no linked account' })

        const cf = await createCloudflareClient(record.zone.accountId)

        // Delete from Cloudflare
        await cf.dns.records.delete(record.cfRecordId, { zone_id: record.zone.cfZoneId })

        // Delete update logs first then the record
        await prisma.updateLog.deleteMany({ where: { recordId: record.id } })
        await prisma.dnsRecord.delete({ where: { id: record.id } })

        if (event.context.userId) {
            await logAudit(
                event.context.userId,
                'DELETE_RECORD',
                `Record: ${record.name} (${record.type})`,
                { zone: record.zone.name, content: record.content }
            )
        }

        return { success: true, message: `Record ${record.name} deleted successfully.` }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to delete record'
        })
    }
})
